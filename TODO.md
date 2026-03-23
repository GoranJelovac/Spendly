# Spendly — TODO

## UI / UX

- [x] Dodati zastave (flags) pored valuta (npr. 🇪🇺 EUR, 🇺🇸 USD, 🇷🇸 RSD)
- [x] Dodati više tema kombinacija (svetla/tamna) i omogućiti biranje u Settings
- [x] Izbaciti biranje teme sa početnog ekrana (sidebar, pored naziva aplikacije)
- [x] Proveriti/ograničiti koliko se stranica Budget Lines može skrolovati (rešeno paginacijom, PAGE_SIZE=15)
- [x] Popraviti zebra striping u Budget Lines (rešeno razdvajanjem flat/grouped prikaza)
- [x] Spojiti Categories i Budget Lines u jednu stranicu — "Budget Plan" sa category carousel navigacijom
- [x] Odlučiti kako nazvati spojenu stranicu — "Budget Plan"

## Budget Plan — sledeći koraci

- [ ] Odlučiti da li zadržati "All" u category dropdown-u i ako da, kako prikazivati (grupisano po kategorijama ili flat lista)
- [ ] Povećati PAGE_SIZE sa 15 na 20
- [ ] Bolje organizovati raspored dugmića (Add Line, Add Category, Rename, Delete, Import, Export)
- [ ] Razmotriti da li treba import kategorija (zasebno od linija)
- [ ] Pregledati kako trenutno radi import linija i da li treba izmene za Budget Plan stranicu
- [ ] Uskladiti izgled Expenses i Contributions stranica sa Budget Plan estetikom (dropdown bar, panel, dugmići)
- [ ] Urediti Billing stranicu
- [ ] Dashboard charts — razdvojiti na dve collapsible grupe: (1) "Planned vs Spent" bar chart, (2) "Budget Breakdown" + "Spending Overview" donut charts zajedno (povećani za bolju čitljivost kad ima mnogo linija/kategorija). Istražiti i alternativne načine prikaza celokupnog budžeta ako postoji bolji od donut-a
