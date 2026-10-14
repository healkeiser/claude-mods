#!/bin/bash
# Counts characters, not bytes, so the card's right edge lines up.
export LC_ALL=C.UTF-8
input=$(cat)

MODEL=$(echo "$input" | jq -r '.model.display_name')
DIR=$(echo "$input" | jq -r '.workspace.current_dir')
PCT=$(echo "$input" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)
DURATION_MS=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')
TOK_IN=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
TOK_OUT=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0')
RATE_5H=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty' | cut -d. -f1)
RATE_7D=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty' | cut -d. -f1)
RESET_5H=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')
RESET_7D=$(echo "$input" | jq -r '.rate_limits.seven_day.resets_at // empty')

GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; RESET=$'\033[0m'; BOLD=$'\033[1m'
ACCENT=$'\033[38;2;217;119;87m'   # Claude orange, as in the mods
DIM=$'\033[38;5;245m'             # labels and secondary text
EDGE=$'\033[38;5;240m'            # card border
# 256-color heat ramp, green -> yellow -> orange -> red: one step per 10% so the
# bar has ten states instead of three. GREY is "not used yet", not chrome.
RAMP=(46 82 118 154 190 226 220 214 208 196); GREY=$'\033[38;5;239m'
NOW=$(date +%s)

# epoch -> countdown ("2h 13m", "3d 4h", "now"). ASCII only, so printf can pad it.
countdown() {
  local left=$(( $1 - NOW ))
  if [ "$left" -le 0 ]; then printf 'now'
  elif [ "$left" -ge 86400 ]; then printf '%dd %dh' $((left / 86400)) $((left % 86400 / 3600))
  elif [ "$left" -ge 3600 ]; then printf '%dh %02dm' $((left / 3600)) $((left % 3600 / 60))
  else printf '%dm' $((left / 60)); fi
}
# epoch -> wall-clock reset ("14:32", or "Thu 09:15" when over a day out)
clock_at() {
  if [ $(( $1 - NOW )) -ge 86400 ]; then date -d "@$1" +'%a %H:%M'; else date -d "@$1" +'%H:%M'; fi
}
# pace <used_pct> <resets_at> <window_secs> -> burn rate vs. the clock, e.g. "1.4×".
# 1.0× = exactly on track to finish the window at 100%; >1 projects an overrun.
# Silent in the first 5% of a window, where the ratio is noise.
pace() {
  local left=$(( $2 - NOW )) elapsed
  elapsed=$(( $3 - left ))
  [ "$elapsed" -lt $(( $3 / 20 )) ] && return
  awk -v u="$1" -v e="$elapsed" -v w="$3" -v y="$YELLOW" -v r="$RED" -v z="$RESET" -v d="$DIM" \
    'BEGIN { s = sprintf("%.1f", u / (e / w * 100))   # color the number shown, not the
             p = s + 0                                # unrounded one, so 1.0x never alarms
             printf "%s%s×%s", (p >= 1.5 ? r : (p > 1 ? y : d)), s, z }'
}
# heat <pct> -> the ramp color for that level
heat() {
  local i=$(( $1 / 10 )); [ "$i" -gt 9 ] && i=9
  printf '\033[38;5;%sm' "${RAMP[i]}"
}
# bar <pct> -> thin gradient bar: each lit cell carries its own heat, so the
# rightmost lit cell is the severity.
bar() {
  local filled=$(( $1 / 10 )) i out=""
  for ((i = 0; i < 10; i++)); do
    if [ "$i" -lt "$filled" ]; then out+=$'\033[38;5;'"${RAMP[i]}"'m━'
    else out+="${GREY}─"; fi
  done
  printf '%s%s' "$out" "$RESET"
}
# 13700 -> 13.7k, 39 -> 39, 1500000 -> 1.5M
fmt_k() {
  if [ "$1" -ge 1000000 ]; then awk -v n="$1" 'BEGIN{printf "%.1fM", n/1000000}'
  elif [ "$1" -ge 1000 ]; then awk -v n="$1" 'BEGIN{printf "%.1fk", n/1000}'
  else printf '%d' "$1"; fi
}
# width <text> -> cells on screen: colour codes and link wrappers take none.
width() {
  local plain
  plain=$(printf '%s' "$1" | sed -E $'s/\033\\[[0-9;]*m//g; s/\033\\]8;;[^\007]*\007//g')
  printf '%d' "${#plain}"
}

###### Header: model, folder, repo link, branch and working-tree summary

NAME="${DIR##*[/\\]}"
URI_PATH="${DIR//\\//}"   # backslashes -> forward slashes for the file URI
HEAD="${ACCENT}${BOLD}${MODEL}${RESET} ${DIM}·${RESET} $(printf '\033]8;;file:///%s\007%s\033]8;;\007' "$URI_PATH" "$NAME")"
if git rev-parse --git-dir > /dev/null 2>&1; then
  REMOTE=$(git remote get-url origin 2>/dev/null | sed 's/\.git$//' | sed 's|git@github.com:|https://github.com/|')
  [ -n "$REMOTE" ] && HEAD+=$(printf ' \033]8;;%s\007%s↗%s\033]8;;\007' "$REMOTE" "$DIM" "$RESET")
  HEAD+=" ${DIM}·${RESET} ${GREEN}$(git branch --show-current 2>/dev/null)${RESET}"
  # working-tree summary: +added ~modified -deleted (zeros omitted)
  ST=$(git status --porcelain 2>/dev/null)
  ADD=$(grep -c '^\(??\|A\)' <<<"$ST"); MOD=$(grep -c '^\(.M\|M\)' <<<"$ST"); DEL=$(grep -c '^\(.D\|D\)' <<<"$ST")
  DIFF=""
  [ "$ADD" -gt 0 ] && DIFF+=" ${GREEN}+$ADD"; [ "$MOD" -gt 0 ] && DIFF+=" ${YELLOW}~$MOD"; [ "$DEL" -gt 0 ] && DIFF+=" ${RED}-$DEL"
  [ -n "$DIFF" ] && HEAD+="${DIFF}${RESET}"
fi

###### Rows: context, then the 5-hour and 7-day limits

# row <label> <pct> <detail> -> "lbl  bar  pct%   detail" with fixed columns.
# The percentage takes the heat of the decile it is *in*, one step past the last
# lit cell, so 95% reads red, not orange.
row() { printf '%s%-3s%s  %s  %s%3d%%%s   %s' "$DIM" "$1" "$RESET" "$(bar "$2")" "$(heat "$2")" "$2" "$RESET" "$3"; }
# rate_row <label> <pct> <resets_at> <window_secs> -> countdown, wall clock, pace.
# Countdown and clock are padded ("6d 22h", "Thu 12:52" are the longest) so the
# pace lands in the same column on every row.
rate_row() {
  local detail="" p
  if [ -n "$3" ]; then
    p=$(pace "$2" "$3" "$4")
    printf -v detail '%s↻ %-7s  %-9s%s  %s' "$DIM" "$(countdown "$3")" "$(clock_at "$3")" "$RESET" "$p"
  fi
  row "$1" "$2" "$detail"
}

MINS=$((DURATION_MS / 60000)); SECS=$(((DURATION_MS % 60000) / 1000))
# Two spaces stand where the rate rows draw "↻ ", so the columns line up.
printf -v CTX_DETAIL '%s  %-7s%s  %s↑ %s%s %s↓ %s%s' "$DIM" "$(printf '%dm %02ds' "$MINS" "$SECS")" "$RESET" \
  "$GREEN" "$(fmt_k "$TOK_IN")" "$RESET" "$YELLOW" "$(fmt_k "$TOK_OUT")" "$RESET"
ROWS=("$(row ctx "$PCT" "$CTX_DETAIL")")
[ -n "$RATE_5H" ] && ROWS+=("$(rate_row 5h "$RATE_5H" "$RESET_5H" 18000)")
[ -n "$RATE_7D" ] && ROWS+=("$(rate_row 7d "$RATE_7D" "$RESET_7D" 604800)")

###### Card: as wide as its widest row, the header set into the top edge

INNER=$(( $(width "$HEAD") + 2 ))
for r in "${ROWS[@]}"; do w=$(width "$r"); [ "$w" -gt "$INNER" ] && INNER=$w; done
line() { local n=$1 out=""; for ((; n > 0; n--)); do out+='─'; done; printf '%s' "$out"; }

printf '%s╭─%s %s %s%s╮%s\n' "$EDGE" "$RESET" "$HEAD" "$EDGE" "$(line $(( INNER - $(width "$HEAD") - 1 )))" "$RESET"
for r in "${ROWS[@]}"; do
  printf '%s│%s %s%*s %s│%s\n' "$EDGE" "$RESET" "$r" $(( INNER - $(width "$r") )) '' "$EDGE" "$RESET"
done
printf '%s╰%s╯%s\n' "$EDGE" "$(line $(( INNER + 2 )))" "$RESET"
exit 0
