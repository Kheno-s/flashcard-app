# Import Format (MVP)

Wir starten bewusst einfach, damit du schnell Karten reinbekommst.

## TSV (Tab-Separated)

Pro Zeile:

```
Front<TAB>Back<TAB>Tags(optional)
```

- **Front**: Vorderseite
- **Back**: Rückseite
- **Tags**: optional, getrennt durch Leerzeichen oder Komma

Beispiel:

```
Was ist ein Anspruch? (§ 194 I BGB)	Das Recht, von einem anderen ein Tun, Dulden oder Unterlassen zu verlangen.	bgb grundbegriffe
Werkvertrag (§ 631 BGB)	Erfolg geschuldet; Unternehmer stellt Werk her, Besteller zahlt Vergütung.	werkvertrag
```

## Warum nicht direkt .apkg?

Anki `.apkg` ist ein ZIP-Container mit SQLite + Media. Machbar, aber mehr Aufwand.
Wir können das später in Phase 2 nachziehen.
