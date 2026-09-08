# Poradnik galerie

## Vytvarny smer

Tovarni, industrialni galerie s jemnym steampunkem. Kov, konstrukcni prvky,
stroje a citelne svetelne kuzele; dila musi zustat hlavnim obsahem prostoru.

## Rozpracovano

- Jedna karta podpory s animovanym logem TipCore, tabule darcu ve stejnem vizualu.
- Vetsi mistnost s podstavcem, cervenym tlacitkem podpory a postupnym rozsvicenim.
- Prizracne prostorove napisy pri vstupu do mistnosti, editovatelne po mistnostech.
- Odebrani nevyuzite mistnosti se steampunk drakem vcetne pruchodu.

## Dalsi krok: autorsky hlas u obrazu

Zadano 2026-09-06. Lukas nahraje a sestriha vlastni vypraveni o obrazu; galerie
bude prehravat hotovy zvukovy soubor. Nejde o synteticky hlas ani automaticky TTS.

- U kazdeho obrazu s nahravkou bude tlacitko prehrat/pozastavit.
- Zvuk vychazi z obrazu nebo jeho tlacitka, s odstupem zeslabuje az do ticha.
- Pouzit existujici prostorove audio galerie a chovani reproduktoru.
- Editor umozni priradit, nahradit a odebrat zvuk u konkretniho obrazu.
- Nahravka a vazba na obraz se zahrnou do exportu a publikace na GitHub Pages.
- Vkladani pres TipCore napojit na existujici spravu galerie; nezavadet druhy exportni tok.
- Pri prepnuti na jiny obraz neprehravat dve vypraveni pres sebe. Hudbu pri
  vypraveni ztisovat a po ukonceni vratit na puvodni hlasitost.
- Overit prostorovy utlum, opakovany poslech, dotykove ovladani a chovani
  po odchodu od obrazu; zadne automaticke prehravani bez stisku tlacitka.

Podklady cekaji na prvni uzivatelovu nahravku a vyber obrazu. Tento krok zatim
neni soucasti upravy mistnosti a karty podpory.

## Nasledujici rozsirovani stavebniho editoru

- Nastenne pilire (pilastry), spojene se stenou, od podlahy az ke stropu.
  Vkladani, presun po stene, sirka, hloubka vystupku, barva a odebrani.
  Pri zmene mistnosti zachovat vazbu na stenu a dopocitat vysku podle stropu.
- Trubky a kolena jako volitelne prostorove objekty. Textury se rozhodnou pozdeji.
- Skutecne 3D ozubene kolo a soukoli: pocet zubu, prumer, osa a pohon.
  Pri zabrani dvou vnejsich kol plati omegaB = -omegaA * zubyA / zubyB.
  Vetsi kolo se otaci pomaleji. Moznost pridavat/odebirat kola a menit vazby.
  Hlidat neslucitelne cykly, vzdalenost os a fazi zubu, nikoliv pouze spustit
  nezavisle vizualni animace. Konkretni funkce stroju zatim neni zadana.
