# Kiosko — reproductor Android

L'aplicació que va a la pantalla. Obre una WebView a pantalla completa i va
rotant pels continguts que li diu el servidor.

## Com funciona

Al dispositiu només s'hi configuren dues coses: **l'adreça de Kiosko** i
**l'identificador de la pantalla**. Tota la resta ve del servidor:

```
GET https://kiosko.aulaia.cat/api/playlist/<slug>
```

```json
{
  "screen": "taller",
  "active": true,
  "reloadSeconds": 300,
  "items": [
    { "label": "Panell", "url": "https://kiosko.aulaia.cat/panel/taller", "seconds": 60 },
    { "label": "Aula Sostenible", "url": "https://…", "seconds": 20 }
  ]
}
```

L'app manté dos temporitzadors independents: un avança la rotació segons els
`seconds` de cada element, i l'altre torna a llegir la llista cada
`reloadSeconds`. Per això un canvi fet al navegador arriba sol a la pantalla,
sense que ningú s'hi hagi d'acostar.

Això és deliberat: si la llista visqués al dispositiu, canviar un temps voldria
dir pujar a cada pantalla amb un teclat.

## Decisions que val la pena conèixer

**Vistes XML i no Compose.** L'app és essencialment una WebView; Compose hi
afegiria l'acoblament entre versions de Kotlin i del compilador de Compose, que
és la font d'errors de compilació més habitual, a canvi de res.

**SharedPreferences i no Room.** Només es desen quatre valors. Una base de
dades aquí seria cerimònia.

**Sense biblioteques de tercers.** `HttpURLConnection` i `org.json`, que ja són
al sistema. Una petició petita cada cinc minuts no justifica cap dependència, i
com menys n'hi ha, menys coses es trenquen en imatges de sistema antigues.

**Comportament quan falla la xarxa.** Es conserva l'última llista bona, de
manera que una pantalla que arrenca sense connexió mostra el contingut d'ahir
en lloc d'un error. Els reintents pugen fins a un minut. Si la pantalla està
desactivada al gestor, es mostra en negre: millor això que contingut caducat.

## Compilar

**No cal compilar-lo a mà.** Cada canvi a `android/` el compila GitHub
Actions (`.github/workflows/android.yml`) i deixa l'APK, ja signat, a una
adreça fixa:

```
https://github.com/MYfabio/pantalles/releases/download/kiosko-android/kiosko.apk
```

Per compilar-lo localment cal l'Android Studio (Ladybug o superior) o el JDK
17 amb el SDK d'Android:

```bash
cd android
gradle assembleRelease      # o ./gradlew si has generat el wrapper
```

L'APK surt a `app/build/outputs/apk/release/app-release.apk`, signat amb
`app/debug.keystore`. Aquesta clau porta les credencials de depuració estàndard
d'Android: no és cap secret, però és *estable*, que és el que fa que una versió
nova s'instal·li sobre l'anterior. El dia que l'app surti dels dispositius del
centre, cal substituir-la per una clau de publicació pròpia.

> El `gradle-wrapper.jar` no és al repositori. L'Android Studio el genera en
> obrir el projecte; des de la terminal, `gradle wrapper` un sol cop.

## Instal·lar en una pantalla

1. Copia l'APK a un llapis USB i connecta'l a la pantalla.
2. Obre el gestor de fitxers del dispositiu i toca l'APK. Android demanarà
   permís per instal·lar d'orígens desconeguts: accepta-ho un cop.
3. **Obre Kiosko manualment.** Android no lliura `BOOT_COMPLETED` a una app que
   no s'ha executat mai des de la instal·lació, així que sense aquest pas
   l'inici automàtic no funcionarà.
4. Introdueix l'adreça i l'identificador de la pantalla, i prem **Provar** per
   confirmar que el servidor respon abans de desar.

## Orientació

Els reproductors de TV (sticks, Chromecast) només treuen imatge en
horitzontal, i els panells de Kiosko són verticals. L'app ho resol girant la
imatge ella mateixa: **per defecte gira 90°**, que és el cas d'una pantalla
muntada de costat amb el cable a baix. A la configuració es pot triar:

| Opció | Quan |
|---|---|
| Vertical (cable a baix) | Pantalla de costat, cable per sota — el cas habitual |
| Vertical (cable a dalt) | Pantalla de costat, cable per sobre |
| Horitzontal | Televisor en posició normal |
| Horitzontal invertit | Televisor cap per avall (muntatge al sostre) |

Per tornar a la configuració un cop està funcionant: **cinc tocs seguits a la
cantonada superior esquerra**. No hi ha cap botó visible, a propòsit.

## Mode quiosc de veritat

L'interruptor de configuració només té efecte si el dispositiu s'ha provisionat
com a *device owner*. Això es fa un sol cop, amb el dispositiu acabat de
restablir i **sense cap compte de Google configurat**:

```bash
adb shell dpm set-device-owner cat.aulaia.kiosko/.KioskoDeviceAdmin
```

A partir d'aquí l'app es fixa a la pantalla i els botons d'inici i recents no
la deixen. Sense provisionar, l'app funciona igual però no queda fixada.

Alternativa més senzilla: a molts dispositius pots definir Kiosko com a
aplicació d'inici (HOME) des dels ajustos del sistema. El manifest ja ho
contempla.

## Resolució de problemes

| Símptoma | Causa habitual |
|---|---|
| Pantalla en negre amb un avís | La pantalla està desactivada al gestor o no té continguts |
| No arrenca sola després d'un tall de llum | L'app no s'ha obert manualment després d'instal·lar-la |
| Es veu contingut antic | El dispositiu no arriba al servidor; mostra la còpia en memòria |
| La pantalla s'apaga sola | Alguna gestió d'energia del fabricant per sobre de l'app; desactiva la suspensió als ajustos del sistema |
