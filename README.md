# alphavantage
Semplice interfaccia grafica responsive per l'utilizzo dell'API Alpha Vantage.

## **Funzionamento dell'interfaccia**


### **Ricerca**

La casella di testo apposita permette di effettuare una ricerca "fuzzy" tra le azienda disponibili, mostrandole in un comodo pannello di suggerimenti.

### **Aggiornamento dati**

Il pulsante posto in alto a destra (logo di Alpha Vantage) permette, attraverso una modale, di aggiungere un azienda ai vari endpoint di JSON-Server.

### Schermata principale

Una volta selezionata l'azienda, sarà possibile studiarne gli stock mensili e settimanali attraverso vari tipi di grafici, consultarne nome, descrizione, logo e sito ufficiale (cliccando sul logo) e, utilizzando l'icona della mappa, anche visualizzarne la posizione.

## **Utilizzo**

-  Aprire un terminale nella directory del progetto e eseguire `npm i`.
-  Nello stesso terminale, eseguire `npm start`.
-  Navigare nel browser all'indirizzo `localhost:3000`.

Se ci fossero errori con `npm start`, modificare le porte configurate nel file `package.json`.


## **Librerie utilizzate**
- **[Bootstrap 5.3](https://getbootstrap.com/)**
-  **[chart.js](https://github.com/chartjs/Chart.js)**
- **[axios 1.13.6](https://www.npmjs.com/package/axios/v/0.27.2)**
- **[maplibre-gl](https://github.com/maplibre/maplibre-gl-js)**
