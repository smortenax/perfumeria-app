#!/bin/sh
# Encadena lotes de moléculas del glosario: congela, da de alta, valida, prueba y sube cada lote sin conflictos; para en el primero con conflictos.
export PATH="/c/Program Files/nodejs:/c/Users/SERGI/.cargo/bin:$PATH"
cd "$(dirname "$0")/../.." || exit 1
clase="${1:-molécula}"
while :; do
  python scripts/v2/glosario.py --nuevo "$clase" > /tmp/lote.txt 2>&1 || { cat /tmp/lote.txt; echo "FIN: no quedan filas"; exit 0; }
  lote=$(grep -o '^Lote [0-9a-z]*' /tmp/lote.txt | cut -d' ' -f2)
  conf=$(( $(wc -l < "datos/v2/conflictos/$lote.csv") - 1 ))
  if [ "$conf" -gt 0 ]; then cat /tmp/lote.txt; echo "PARA: el lote $lote tiene $conf conflictos"; exit 0; fi
  python scripts/v2/alta.py > /tmp/alta.txt 2>&1 || { cat /tmp/alta.txt; echo "FALLA alta"; exit 1; }
  npm run validar:v2 > /tmp/val.txt 2>&1 || { tail -5 /tmp/val.txt; echo "FALLA validar"; exit 1; }
  npx vitest run > /tmp/vt.txt 2>&1 || { tail -15 /tmp/vt.txt; echo "FALLAN pruebas"; exit 1; }
  git add -A datos docs scripts src
  printf 'v2 Fase 6, lote %s: moléculas del glosario v1 (identidad del FIG y estándares del índice de IFRA), sin conflicto\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\n' "$lote" > /tmp/msg.txt
  git commit -q -F /tmp/msg.txt && git push -q 2>&1 | grep -v warning
  grep -A1 "Resumen" /tmp/lote.txt >/dev/null; sed -n '/Resumen/,/^$/p' /tmp/lote.txt | tail -n +1 > /tmp/res.txt
  echo "OK $lote"
done
