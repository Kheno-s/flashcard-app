# Import Format (MVP)

Wir starten bewusst pragmatisch: **TSV/CSV Copy&Paste** (später: Datei-Import, später: Anki `.apkg`).

## Unterstützte Formate

### TSV (Tab-Separated)

Pro Zeile:

```
Front<TAB>Back<TAB>Tags(optional)
```

### CSV (Comma/Semicolon-Separated)

Pro Zeile:

```
Front,Back,Tags(optional)
Front;Back;Tags(optional)
```

- **Tags** optional, getrennt durch Leerzeichen oder Komma
- **Header-Zeile** wie `Front,Back,Tags` wird automatisch ignoriert
- Minimaler CSV-Quote Support: `"..."` (inkl. `""` als escaped quote)

## Beispiele

**TSV:**

```
Was ist ein Anspruch? (§ 194 I BGB)	Das Recht, von einem anderen ein Tun, Dulden oder Unterlassen zu verlangen.	bgb grundbegriffe
```

**CSV:**

```
Werkvertrag (§ 631 BGB),"Erfolg geschuldet; Unternehmer stellt Werk her, Besteller zahlt Vergütung.",werkvertrag
```

## Warum nicht direkt Anki .apkg?

Anki `.apkg` ist ein ZIP-Container mit SQLite + Media. Machbar, aber mehr Aufwand.
Wir können das später in Phase 2 nachziehen.
