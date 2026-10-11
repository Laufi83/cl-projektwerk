/** Messegelände-Guide. Redaktionelle Rohdaten vom Auftraggeber (11.10.2026).
 * Empfehlungen, Öffnungszeiten, Verkehrslinien und Größenangaben sind vor Nutzung vor Ort zu prüfen.
 * Stadtmittelpunkte markieren die Übersicht; sie sind keine präzisen Hallen-/Eingangskoordinaten. */
export type MesseVenue = {id:string;number:number;city:string;venue:string;lat:number|null;lon:number|null;facts:{area?:string;insider?:string;cityInfo?:string;hotels?:string;dining?:string;travel?:string}};
export const messeVenues: MesseVenue[] = [
  {
    "number": 1,
    "city": "Hannover",
    "venue": "Messegelände Hannover",
    "facts": {
      "area": "Das flächenmäßig größte Messeareal der Welt bietet rund 450.000 m² Gesamtfläche.",
      "insider": "Die Wege sind gigantisch. Nutzen Sie unbedingt den Skywalk (eine wettergeschützte, gläserne Fußgängerbrücke mit Laufbändern), um schnell zwischen den Hallen im Norden und Süden zu wechseln. Bei Großmessen wie der Agritechnica gibt es zudem einen internen Shuttle-Bus-Service.",
      "cityInfo": "ca. 545.000 Einwohner | Gegründet 1150 | Protestantisch & konfessionslos | ca. 15.000 Hotelzimmer. Sehenswert: Herrenhäuser Gärten, Neues Rathaus, Maschsee.",
      "hotels": "Das Radisson Blu Hotel Hannover liegt direkt am Messegelände und spart wertvolle Pendelzeit. Gehobener wohnt es sich im Kastens Hotel Luisenhof in der Innenstadt.",
      "dining": "Das Restaurant Die Insel direkt am Maschsee bietet gehobene Küche und ist ideal für ein Business-Dinner nach Messeschluss.",
      "travel": "Vom Hauptbahnhof bringt Sie die Stadtbahnlinie 8 in genau 18 Minuten direkt zum Eingang Nord. Wer fliegt, nimmt die S-Bahn S5 vom Flughafen zum Hauptbahnhof und steigt dort um."
    },
    "id": "venue-01",
    "lat": 52.37,
    "lon": 9.74
  },
  {
    "number": 2,
    "city": "München",
    "venue": "Messe München",
    "facts": {
      "area": "ca. 414.000 m² Gesamtfläche, davon ein gewaltiges Freigelände, das bei der Weltleitmesse bauma mit hunderten Kränen bespielt wird.",
      "insider": "Das Gelände in Riem ist extrem logisch aufgebaut. Der zentrale Verbindungsgang (\"Messe-Express\") führt schnurgerade durch alle Hallenpaare. Nutzen Sie die Dachterrasse der Messehalle B6 für einen ruhigen Moment abseits des Trubels.",
      "cityInfo": "ca. 1.510.000 Einwohner | Gegründet 1158 | Mehrheitlich katholisch & konfessionslos | ca. 42.000 Hotelzimmer. Sehenswert: Marienplatz, Englischer Garten, Schloss Nymphenburg.",
      "hotels": "Das H4 Hotel München Messe liegt direkt neben den Hallen. Wer den bayerischen Charme sucht, bucht das traditionsreiche Hotel Platzl in der Altstadt.",
      "dining": "Das Schuhbecks in den Südtiroler Stuben oder für ein authentisches Teamevent das Hofbräuhaus. Für erstklassiges Sushi nach der Messe empfiehlt sich das Mun im Haidhausen-Viertel.",
      "travel": "Die U-Bahn-Linie U2 fährt vom Hauptbahnhof direkt zu den Stationen \"Messestadt West\" und \"Messestadt Ost\". Autofahrer nutzen die Autobahn A94; das dynamische Parkleitsystem leitet effizient in das riesige Parkhaus."
    },
    "id": "venue-02",
    "lat": 48.14,
    "lon": 11.58
  },
  {
    "number": 3,
    "city": "Frankfurt am Main",
    "venue": "Messe Frankfurt",
    "facts": {
      "area": "ca. 400.000 m² Gesamtfläche. Ein vertikal und horizontal dicht vernetztes innerstädtisches Areal.",
      "insider": "Der Messeturm ist zwar das Wahrzeichen, steht aber außerhalb des abgesperrten Geländes. Nutzen Sie den imposanten Torhaus-Komplex für Meetings. Die Halle 12 ist das neueste architektonische Highlight mit modernster Belüftungstechnik.",
      "cityInfo": "ca. 775.000 Einwohner | Gegründet 794 | Konfessionslos, katholisch, muslimisch | ca. 36.000 Hotelzimmer. Sehenswert: Römerberg, Mainufer-Skyline, Goethe-Haus.",
      "hotels": "Das Maritim Hotel Frankfurt hat einen direkten Zugang zum Messegelände. Für ein stylisches Erlebnis wählen Sie das 25hours Hotel The Trip nahe dem Hauptbahnhof.",
      "dining": "Das Restaurant Main Tower Restaurant & Lounge bietet Fine Dining im 53. Stock mit Blick auf die Skyline – Reservierung Wochen im Voraus zwingend erforderlich.",
      "travel": "Unschlagbare Bahnanbindung. Die S-Bahn-Linien S3, S4, S5 und S6 fahren vom Hauptbahnhof direkt zur Station \"Frankfurt(Main)Messe\" inmitten des Geländes."
    },
    "id": "venue-03",
    "lat": 50.11,
    "lon": 8.68
  },
  {
    "number": 4,
    "city": "Köln",
    "venue": "Koelnmesse",
    "facts": {
      "area": "ca. 384.000 m² Gesamtfläche. Legendär für Publikumsmessen wie die gamescom.",
      "insider": "Die \"Messeboulevard\" genannte zentrale Achse verbindet alle Hallen auf einer Ebene. Bei Großmessen ist der Südeingang oft weniger überlaufen als der Haupteingang Nord.",
      "cityInfo": "ca. 1.085.000 Einwohner | Gegründet 38 v. Chr. | Christlich & säkular | ca. 17.500 Hotelzimmer. Sehenswert: Kölner Dom, Hohenzollernbrücke, Altstadt.",
      "hotels": "Das Hyatt Regency Köln in Deutz bietet einen spektakulären Blick auf den Dom und liegt nur wenige Gehminuten vom Messe-Südeingang entfernt.",
      "dining": "Ein echtes Kölner Kölsch trinkt man im Brauhaus zur Malzmühle. Für geschäftliche Abendessen auf Top-Niveau ist das Le Moissonnier eine feste Instanz.",
      "travel": "Der Bahnhof Köln Messe/Deutz wird von zahlreichen ICE-Zügen direkt angefahren. Sie müssen nicht einmal über den Kölner Hauptbahnhof reisen."
    },
    "id": "venue-04",
    "lat": 50.94,
    "lon": 6.96
  },
  {
    "number": 5,
    "city": "Düsseldorf",
    "venue": "Messe Düsseldorf",
    "facts": {
      "area": "ca. 305.000 m² Gesamtfläche. Direkt am Rhein gelegen, weltbekannt für die Wassersportmesse boot.",
      "insider": "Die Hallen 1 bis 7 bilden einen geschlossenen Kreis, was die Orientierung erleichtert. Die Messe besitzt eine eigene Schiffsanlegestelle am Rhein – manche Aussteller mieten Hotelschiffe, die direkt dort anlegen.",
      "cityInfo": "ca. 630.000 Einwohner | Gegründet 1288 | Überwiegend christlich | ca. 20.000 Hotelzimmer. Sehenswert: Rheinuferpromenade, Königsallee, Altstadt.",
      "hotels": "Das Tulip Inn Düsseldorf Arena ist direkt in die benachbarte Arena integriert und liegt direkt am Messegelände. In der City überzeugt das Breidenbacher Hof.",
      "dining": "Düsseldorf hat die größte japanische Community Deutschlands. Gehen Sie für phänomenale Ramen ins Takumi im \"Little Tokyo\"-Viertel (Immermannstraße).",
      "travel": "Die Stadtbahn U78 fährt von der Altstadt und dem Hauptbahnhof direkt zum Messe-Gelände. Vom Flughafen Düsseldorf sind es mit dem Taxi nur knapp 7 Minuten."
    },
    "id": "venue-05",
    "lat": 51.23,
    "lon": 6.78
  },
  {
    "number": 6,
    "city": "Nürnberg",
    "venue": "NürnbergMesse",
    "facts": {
      "area": "ca. 195.000 m² Gesamtfläche. Berühmt für die Spielwarenmesse.",
      "insider": "Die von Zaha Hadid entworfenen Hallen 3A und 3C sind architektonische Meisterwerke und bieten durch ihre Tageslichtflutung eine extrem angenehme Arbeitsatmosphäre.",
      "cityInfo": "ca. 530.000 Einwohner | Gegründet 1050 | Protestantisch & katholisch | ca. 13.500 Hotelzimmer. Sehenswert: Kaiserburg, Albrecht-Dürer-Haus, Hauptmarkt.",
      "hotels": "Das Arvena Park Hotel liegt nur eine U-Bahn-Station von der Messe entfernt. Im Zentrum bietet das Sheraton Carlton erstklassigen Komfort.",
      "dining": "Traditionelle Nürnberger Rostbratwürste isst man im Zum Gulden Stern (ältestes Bratwurstküche der Welt). Für Business-Dinner empfiehlt sich das Sterne-Restaurant Essigbrätlein.",
      "travel": "Die U-Bahn-Linie U1 fährt vom Hauptbahnhof in nur 8 Minuten direkt zur Station \"Messe\". Absolut stressfrei."
    },
    "id": "venue-06",
    "lat": 49.45,
    "lon": 11.08
  },
  {
    "number": 7,
    "city": "Berlin",
    "venue": "Messe Berlin",
    "facts": {
      "area": "ca. 170.000 m² Gesamtfläche rund um den historischen Sommergarten.",
      "insider": "Das Gelände ist stark verwinkelt. Nutzen Sie den kreisrunden Sommergarten im Zentrum als Orientierungspunkt. Das CityCube Berlin ist die modernste Erweiterung für Großkongresse.",
      "cityInfo": "ca. 3.750.000 Einwohner | Gegründet 1237 | Überwiegend konfessionslos | ca. 70.000 Hotelzimmer. Sehenswert: Brandenburger Tor, Reichstag, Museumsinsel.",
      "hotels": "Das Waldorf Astoria Berlin am nahegelegenen Bahnhof Zoo bietet Luxus pur. Direkt an der Messe liegt das funktionale Ibis Berlin Messe.",
      "dining": "Für den großen Eindruck das Borchardt in Mitte. Wer es exklusiv und asiatisch-europäisch mag, reserviert im The George R nahe dem Kurfürstendamm.",
      "travel": "Nutzen Sie die S-Bahn-Linien S3, S5, S7 oder S9 bis zur Station \"Messe Süd\" oder die U-Bahn U2 bis \"Kaiserdamm\". Vermeiden Sie die Anreise mit dem Auto über den vielbefahrenen Stadtring A100."
    },
    "id": "venue-07",
    "lat": 52.52,
    "lon": 13.4
  },
  {
    "number": 8,
    "city": "Stuttgart",
    "venue": "Hierarchie-Korrektur / Fortsetzung der Top-Standorte: Stuttgart",
    "facts": {
      "area": "ca. 130.000 m² Gesamtfläche. Direkt an der Startbahn des Stuttgarter Flughafens gelegen.",
      "insider": "Durch die Lage direkt über der Autobahn A8 und neben dem Flughafen ist dies das logistisch am schnellsten erreichbare Gelände Deutschlands. Der Innenhof (\"Messepiazza\") ist ein windgeschützter Treffpunkt.",
      "cityInfo": "ca. 630.000 Einwohner | Gegründet ca. 950 | Christlich geprägt | ca. 16.000 Hotelzimmer. Sehenswert: Mercedes-Benz Museum, Porsche Museum, Schlossplatz.",
      "hotels": "Das Mövenpick Hotel Stuttgart Airport & Messe liegt sprichwörtlich nur 200 Meter von den Halleneingängen entfernt.",
      "dining": "Hervorragende schwäbische Maultaschen gibt es in der Weinstube Schellenturm in der Stuttgarter Innenstadt.",
      "travel": "S-Bahn S2 oder S3 vom Hauptbahnhof direkt zur Station \"Flughafen/Messe\". Perfekt für internationale Tagesgäste, die einfliegen und abends wieder abheben."
    },
    "id": "venue-08",
    "lat": 48.78,
    "lon": 9.18
  },
  {
    "number": 9,
    "city": "Leipzig",
    "venue": "Leipziger Messe",
    "facts": {
      "area": "ca. 131.000 m² Gesamtfläche. Das Wahrzeichen ist die imposante, 243 Meter lange Glashalle.",
      "insider": "Die freitragende Glashalle dient als zentraler Verteiler. Hier finden bei der Leipziger Buchmesse die großen Lesungen statt. Im Winter ist die Glashalle beheizt, dennoch empfiehlt sich eine Jacke beim Hallenwechsel.",
      "cityInfo": "ca. 620.000 Einwohner | Gegründet 1165 | Überwiegend konfessionslos | ca. 11.000 Hotelzimmer. Sehenswert: Völkerschlachtdenkmal, Thomas-Kirche, Mädlerpassage.",
      "hotels": "Das Sachsenpark Hotel liegt in Gehdistanz. Im Stadtzentrum empfiehlt sich das luxuriöse Steigenberger Grandhotel Handelshof.",
      "dining": "Ein Besuch in Auerbachs Keller (bekannt aus Goethes Faust) gehört zum Pflichtprogramm. Moderne Küche auf Top-Niveau bietet das Stadtpfeiffer im Gewandhaus.",
      "travel": "Die Straßenbahnlinie 16 fährt vom Hauptbahnhof direkt bis zum Messevorplatz. Autofahrer schätzen die direkte Abfahrt von der Autobahn A14."
    },
    "id": "venue-09",
    "lat": 51.34,
    "lon": 12.37
  },
  {
    "number": 10,
    "city": "Essen",
    "venue": "Messe Essen",
    "facts": {
      "area": "ca. 120.000 m² Gesamtfläche mitten im Ruhrgebiet.",
      "insider": "Das Gelände wurde komplett modernisiert und bietet nun großzügige, tageslichtdurchflutete Hallenachsen. Der Zugang über den Grugapark bietet eine grüne Oase zum Durchatmen.",
      "cityInfo": "ca. 585.000 Einwohner | Gegründet 845 | Christlich geprägt | ca. 6.500 Hotelzimmer. Sehenswert: Zeche Zollverein, Villa Hügel, Museum Folkwang.",
      "hotels": "Das Atlantic Congress Hotel Essen liegt unmittelbar an den Messehallen und verfügt über eine hervorragende Rooftop-Bar.",
      "dining": "Die Casino Zollverein bietet gehobene Küche in der spektakulären Industriearchitektur der ehemaligen Zeche.",
      "travel": "Die U-Bahn-Linie U11 fährt vom Hauptbahnhof Essen direkt zum Messegelände (Stationen Messe Ost/Gruahalle und Messe West-Süd)."
    },
    "id": "venue-10",
    "lat": 51.46,
    "lon": 7.01
  },
  {
    "number": 11,
    "city": "Mailand",
    "venue": "Fiera Milano - Rho",
    "facts": {
      "area": "ca. 405.000 m² Gesamtfläche. Das architektonische Meisterwerk von Massimiliano Fuksas besticht durch ein riesiges, wellenförmiges Glasdach über der Hauptachse.",
      "insider": "Das Gelände ist extrem langgestreckt. Leihen Sie sich bei mehrtägigen Aufenthalten frühzeitig einen der internen E-Scooter, falls verfügbar. Die Gastronomiebereiche auf den oberen Ebenen der Hallen bieten oft besseres Essen als die Kioske am Boden.",
      "cityInfo": "ca. 1.400.000 Einwohner | Gegründet ca. 600 v. Chr. | Römisch-katholisch | ca. 45.000 Hotelzimmer. Sehenswert: Mailänder Dom, Galleria Vittorio Emanuele II, Castello Sforzesco.",
      "hotels": "Das NH Collection Milano CityLife bietet stylischen Komfort im modernen Stadtviertel, von wo aus die Messe per U-Bahn schnell erreichbar ist.",
      "dining": "Für geschäftliche Erfolge: Das Il Luogo di Aimo e Nadia (zwei Michelin-Sterne). Unbedingt das echte Risotto alla Milanese probieren.",
      "travel": "Nehmen Sie die rote U-Bahn-Linie M1 direkt bis zur Endstation \"Rho Fiera\". Achtung: Sie benötigen ein spezielles Vorort-Ticket, das normale Stadtticket gilt hier nicht!"
    },
    "id": "venue-11",
    "lat": 45.46,
    "lon": 9.19
  },
  {
    "number": 12,
    "city": "Paris",
    "venue": "Paris Nord Villepinte",
    "facts": {
      "area": "ca. 268.000 m² Gesamtfläche im Norden der französischen Hauptstadt, nahe dem Flughafen CDG.",
      "insider": "Da das Gelände außerhalb des Zentrums liegt, sind die Taxischlangen nach Messeschluss legendär lang. Nutzen Sie Uber oder reservieren Sie vorab einen privaten Fahrservice.",
      "cityInfo": "ca. 2.150.000 Einwohner | Antike Wurzeln | Römisch-katholisch & divers | ca. 85.000 Hotelzimmer. Sehenswert: Eiffelturm, Louvre, Montmartre.",
      "hotels": "Das Pullman Paris Roissy CDG Airport bietet schnellen Zugang sowohl zur Messe als auch zum Terminal.",
      "dining": "Im Zentrum von Paris: Das Le Train Bleu im Bahnhof Gare de Lyon bietet atemberaubendes Barock-Ambiente für ein unvergessliches Abendessen.",
      "travel": "Die S-Bahn RER B fährt vom Pariser Zentrum direkt zur Station \"Parc des Expositions\". Vermeiden Sie die Anreise per Auto über die Autobahn A1 zu den Stoßzeiten – chronischer Stau gefahr."
    },
    "id": "venue-12",
    "lat": 48.86,
    "lon": 2.35
  },
  {
    "number": 13,
    "city": "Paris",
    "venue": "Paris Expo Porte de Versailles",
    "facts": {
      "area": "ca. 215.000 m² Ausstellungsfläche. Das traditionsreiche, innerstädtische Messegelände im Süden von Paris.",
      "insider": "Die Halle 7 verfügt über eine der größten Dachfarmen Europas (Urban Farming). Hier kann man frische Produkte direkt vor Ort genießen.",
      "cityInfo": "Siehe Paris (oben). Drei weitere Highlights: Centre Pompidou, Sainte-Chapelle, Jardin du Luxembourg.",
      "hotels": "Das Mama Shelter Paris West liegt direkt an der Porte de Versailles und bietet eine extrem hippe Atmosphäre mit Dachterrasse.",
      "dining": "Das Restaurant Le Quinzième von Chefkoch Cyril Lignac bietet moderne französische Küche unweit des Geländes.",
      "travel": "Perfekt angebunden über die U-Bahn-Linie 12 (Station Porte de Versailles) sowie die Trambahnen T2 und T3a."
    },
    "id": "venue-13",
    "lat": 48.86,
    "lon": 2.35
  },
  {
    "number": 14,
    "city": "Barcelona",
    "venue": "Fira Barcelona - Gran Via",
    "facts": {
      "area": "ca. 240.000 m² hochmoderne Hallenkapazität. Schauplatz des Mobile World Congress.",
      "insider": "Das Gelände verfügt über ein wegweisendes, vollautomatisches Transportsystem für Waren. Für Besucher ist der kilometerlange, erhöhte Zentrallaufsteg der beste Weg, um ohne Hallengetümmel von A nach B zu gelangen.",
      "cityInfo": "ca. 1.630.000 Einwohner | Antike Gründung | Römisch-katholisch | ca. 40.000 Hotelzimmer. Sehenswert: Sagrada Família, Park Güell, Gotisches Viertel.",
      "hotels": "Das Hotel Porta Fira ist ein spektakulärer roter Turm direkt gegenüber der Messe, entworfen von Toyo Ito.",
      "dining": "Für exzellente Meeresfrüchte und Business-Gespräche: Botafumeiro im Stadtteil Gràcia. Für Tapas auf hohem Niveau das Tickets (rechtzeitig buchen!).",
      "travel": "Die U-Bahn-Linie L9 Sud verbindet den Flughafen Barcelona direkt mit der Station \"Fira\" auf dem Messegelände – ideal für die Durchreise."
    },
    "id": "venue-14",
    "lat": 41.39,
    "lon": 2.17
  },
  {
    "number": 15,
    "city": "Madrid",
    "venue": "IFEMA - Feria de Madrid",
    "facts": {
      "area": "ca. 210.000 m² Gesamtfläche. Ein perfekt symmetrisch angeordneter Komplex im Nordosten Madrids.",
      "insider": "Die Hallen sind um einen zentralen, kreisrunden Hof angeordnet. Hier gibt es zahlreiche schattige Plätze. Die IFEMA verfügt über ein erstklassiges, eigenes Kongresszentrum im Nordpalast.",
      "cityInfo": "ca. 3.300.000 Einwohner | Gegründet im 9. Jh. | Römisch-katholisch | ca. 50.000 Hotelzimmer. Sehenswert: Palacio Real, Museo del Prado, Plaza Mayor.",
      "hotels": "Das Novotel Madrid Campo de las Naciones liegt nur wenige Gehminuten entfernt und bietet einen Außenpool zur Entspannung im Sommer.",
      "dining": "Das Restaurant Amazonico im Stadtviertel Salamanca bietet Fine Dining mit Dschungel-Ambiente und einer angeschlossenen Jazz-Bar.",
      "travel": "Die U-Bahn-Linie 8 fährt vom Flughafen Madrid-Barajas in nur zwei Stationen direkt zur Haltestelle \"Feria de Madrid\"."
    },
    "id": "venue-15",
    "lat": 40.42,
    "lon": -3.7
  },
  {
    "number": 16,
    "city": "Valencia",
    "venue": "Feria Valencia",
    "facts": {
      "area": "ca. 230.000 m² Gesamtfläche. Eines der größten und modernsten Messezentren in Spanien mit einer markanten Glas-Zentralhalle.",
      "insider": "Die obere Ebene bietet einen fantastischen Blick über das Umland. Nutzen Sie die separaten VIP-Lounges in den Pavillons 1 und 2 für ungestörte Verhandlungen.",
      "cityInfo": "ca. 800.000 Einwohner | Gegründet 138 v. Chr. | Römisch-katholisch | ca. 14.000 Hotelzimmer. Sehenswert: Ciudad de las Artes y las Ciencias, Seidenbörse, Zentralmarkt.",
      "hotels": "Das Sercotel Sorolla Palace bietet hervorragende Business-Ausstattung und liegt strategisch günstig zwischen Messe und City.",
      "dining": "Valencia ist die Geburtsstadt der Paella. Essen Sie eine authentische Paella Valenciana im traditionellen Restaurant La Pepica direkt am Strand.",
      "travel": "Die Metro-Linie 2 fährt direkt zur Station \"Les Carolines | Fira\". Bei Großmessen fährt zudem die Tram-Linie 4 direkt vor den Haupteingang."
    },
    "id": "venue-16",
    "lat": 39.47,
    "lon": -0.38
  },
  {
    "number": 17,
    "city": "Bologna",
    "venue": "BolognaFiere",
    "facts": {
      "area": "ca. 145.000 m² Gesamtfläche. Das Herz der italienischen Kosmetik- und Keramikindustrie.",
      "insider": "Das Gelände war das erste weltweit mit einem eigenen Autobahnanschluss. Die Hallen weisen teilweise beträchtliche Höhen auf, ideal für zweistöckige, opulente Messestände.",
      "cityInfo": "ca. 395.000 Einwohner | Etruskische Wurzeln | Römisch-katholisch | ca. 8.000 Hotelzimmer. Sehenswert: Die zwei Türme, Piazza Maggiore, die kilometerlangen Arkaden (UNESCO).",
      "hotels": "Das Unahotels Bologna Fiera bietet modernen Komfort direkt neben dem Messegelände.",
      "dining": "Bologna gilt als kulinarische Hauptstadt Italiens (\"La Grassa\"). Bestellen Sie echte Tagliatelle al Ragù (niemals Spaghetti Bolognese!) in der Trattoria di Via Serra.",
      "travel": "Vom Hauptbahnhof Bologna (einem der wichtigsten Bahnknotenpunkte Italiens) fahren die Buslinien 35 und 38 in nur 10 Minuten direkt zur Messe."
    },
    "id": "venue-17",
    "lat": 44.49,
    "lon": 11.34
  },
  {
    "number": 18,
    "city": "Verona",
    "venue": "Veronafiere",
    "facts": {
      "area": "ca. 165.000 m² Gesamtfläche. Berühmt für die Weinmesse Vinitaly.",
      "insider": "Während der Vinitaly herrscht in der gesamten Stadt Ausnahmezustand. Die Hallen weisen im Sommer hohe Temperaturen auf; kleiden Sie sich in leichten, aber professionellen Schichten (Business Casual).",
      "cityInfo": "ca. 260.000 Einwohner | Römische Gründung | Römisch-katholisch | ca. 7.500 Hotelzimmer. Sehenswert: Arena von Verona, Balkon der Julia, Castelvecchio.",
      "hotels": "Das Hotel Crowne Plaza Verona liegt im Business-Distrikt nahe der Messe und bietet einen exzellenten Shuttleservice.",
      "dining": "Das Restaurant Il Desco bietet kreative, italienische Küche auf allerhöchstem Niveau (Michelin-Stern).",
      "travel": "Der Bahnhof Verona Porta Nuova liegt etwa 2 Kilometer von der Messe entfernt. Während großer Events pendeln kostenlose Non-Stop-Shitbusse zwischen Bahnhof und Gelände."
    },
    "id": "venue-18",
    "lat": 45.44,
    "lon": 10.99
  },
  {
    "number": 19,
    "city": "Birmingham",
    "venue": "NEC - National Exhibition Centre",
    "facts": {
      "area": "ca. 200.000 m² Gesamtfläche. Ein riesiger, zusammenhängender Hallenkomplex im Herzen Englands.",
      "insider": "Das NEC verfügt über einen eigenen, riesigen See (Pendigo Lake). Ein Spaziergang am Ufer ist die beste Fluchtmöglichkeit vor dem Messelärm. Das angeschlossene Resorts World bietet Kinos, Outlets und Restaurants direkt auf dem Areal.",
      "cityInfo": "ca. 1.150.000 Einwohner | Gegründet 1166 | Multireligiös | ca. 15.000 Hotelzimmer. Sehenswert: Library of Birmingham, Kanalsystem, Birmingham Museum & Art Gallery.",
      "hotels": "Das Genting Hotel im Resorts World-Komplex liegt direkt auf dem Gelände und bietet erstklassigen Luxus inklusive Spa.",
      "dining": "Birmingham ist berühmt für das \"Balti Triangle\". Essen Sie ein authentisches, britisches Balti-Curry im Restaurant Shabab.",
      "travel": "Unschlagbare Anbindung: Der Bahnhof Birmingham International ist direkt mit dem NEC verbunden. Züge aus London benötigen nur ca. 70 Minuten. Zudem gibt es eine kostenlose Seilbahn (\"Air-Rail Link\") direkt zum Flughafen Birmingham."
    },
    "id": "venue-19",
    "lat": 52.49,
    "lon": -1.89
  },
  {
    "number": 20,
    "city": "London",
    "venue": "ExCeL London",
    "facts": {
      "area": "ca. 100.000 m² reine, ebenerdige Hallenfläche entlang des königlichen Docks (Royal Docks).",
      "insider": "Das ExCeL besteht im Wesentlichen aus zwei gigantischen, parallel verlaufenden Hallensträngen, die durch einen zentralen, fast einen Kilometer langen Innenboulevard getrennt sind. Hier finden Sie alle namhaften britischen Kaffeeketten.",
      "cityInfo": "ca. 9.000.000 Einwohner | Gegründet 43 n. Chr. | Hochgradig multikulturell | ca. 110.000 Hotelzimmer. Sehenswert: Tower of London, British Museum, Westminster Abbey.",
      "hotels": "Das Aloft London Excel ist direkt an das Messezentrum angebunden und besticht durch sein modernes, technikaffines Design.",
      "dining": "Nutzen Sie die IFS Cloud Cable Car (Seilbahn) direkt vor der Tür, um über die Themse zur O2-Arena zu fahren. Dort finden Sie das Restaurant Gaucho für erstklassige Steaks.",
      "travel": "Dank der Elizabeth Line (Station Custom House direkt vor dem Eingang) gelangen Sie nun in weniger als 20 Minuten aus der Londoner Innenstadt (West End) zur Messe."
    },
    "id": "venue-20",
    "lat": 51.51,
    "lon": -0.13
  },
  {
    "number": 21,
    "city": "Basel",
    "venue": "Messe Basel",
    "facts": {
      "area": "ca. 141.000 m² Gesamtfläche. Das optische Highlight ist das \"Loch im Dach\" (die City Lounge), eine spektakuläre Deckenöffnung über dem Messeplatz.",
      "insider": "Da die Messe vertikal in mehreren Stockwerken organisiert ist, sollten Sie bei Standbesuchen die Wartezeiten an den Rolltreppen und Aufzügen zu Stoßzeiten einplanen.",
      "cityInfo": "ca. 175.000 Einwohner | Gegründet 374 | Konfessionslos & christlich | ca. 6.500 Hotelzimmer. Sehenswert: Basler Münster, Kunstmuseum, Altstadt am Rhein.",
      "hotels": "Das Hyperion Hotel Basel befindet sich direkt im 105 Meter hohen Messeturm – der Blick über die Stadt und das Dreiländereck ist atemberaubend.",
      "dining": "Für das exklusive Geschäftsessen: Das Drei-Sterne-Restaurant Cheval Blanc by Peter Knogl im Grand Hotel Les Trois Rois direkt am Rhein.",
      "travel": "Basel bietet allen Hotelgästen das kostenlose \"BaselCard\"–Ticket für den Nahverkehr. Die Tramlinien 1 und 2 fahren vom Bahnhof Basel SBB direkt zum Messeplatz."
    },
    "id": "venue-21",
    "lat": 47.56,
    "lon": 7.59
  },
  {
    "number": 22,
    "city": "Genf",
    "venue": "Palexpo",
    "facts": {
      "area": "ca. 106.000 m² vollkommen überdachte Fläche. Austragungsort von Watches and Wonders.",
      "insider": "Die Halle 7 liegt technisch gesehen auf der anderen Seite der Autobahn und ist über einen massiven, überdachten Brückenkomplex mit den Haupthallen verbunden. Planen Sie diesen Fußweg zeitlich ein.",
      "cityInfo": "ca. 205.000 Einwohner | Römische Wurzeln | Christlich & international | ca. 10.000 Hotelzimmer. Sehenswert: Jet d’Eau, UN-Palast, Genfer See.",
      "hotels": "Das Hilton Geneva Hotel & Conference Centre liegt direkt gegenüber dem Palexpo und verfügt über den größten Hotel-Innenpool der Schweiz.",
      "dining": "Genießen Sie ein traditionelles Schweizer Käsefondue im urigen Les Armures in der Genfer Altstadt.",
      "travel": "Sensationell kurze Wege: Das Palexpo liegt nur 10 Gehminuten oder eine kurze Busfahrt (Linie 5) vom Flughafen Genf und dem dazugehörigen Bahnhof Genève-Aéroport entfernt."
    },
    "id": "venue-22",
    "lat": 46.2,
    "lon": 6.14
  },
  {
    "number": 23,
    "city": "Brüssel",
    "venue": "Brussels Expo",
    "facts": {
      "area": "ca. 115.000 m² Nutzfläche. Der historische Komplex im Art-déco-Stil wurde für die Weltausstellung 1935 errichtet.",
      "insider": "Die berühmte Halle 5 (Palais 5) verfügt über eine faszinierende, historische Betonkuppel-Architektur. Das gesamte Areal liegt im Schatten des weltbekannten Atomiums – das perfekte Fotomotiv direkt nach dem Verlassen der Hallen.",
      "cityInfo": "ca. 1.230.000 Einwohner | Gegründet 979 | Katholisch & muslimisch | ca. 22.000 Hotelzimmer. Sehenswert: Grand-Place, Atomium, Manneken Pis.",
      "hotels": "In unmittelbarer Nähe gibt es primär Budget-Optionen. Buchen Sie lieber das elegante The Steigenberger Wiltcher’s an der luxuriösen Avenue Louise in der City.",
      "dining": "Für erstklassige belgische Küche und Meeresfrüchte empfiehlt sich das Aux Armes de Bruxelles nahe der Grand-Place.",
      "travel": "Nehmen Sie die Metro-Linie 6 direkt bis zur Endstation \"Heysel\". Das Auto sollten Sie in Brüssel aufgrund des dichten Berufsverkehrs meiden."
    },
    "id": "venue-23",
    "lat": 50.85,
    "lon": 4.35
  },
  {
    "number": 24,
    "city": "Amsterdam",
    "venue": "RAI Amsterdam",
    "facts": {
      "area": "ca. 112.000 m² Gesamtfläche. Ein hocheffizientes, topmodernes Kongress- und Messezentrum im Süden der Stadt.",
      "insider": "Die RAI besitzt einen eigenen kleinen Yachthafen. Bei manchen Events kann man per Wassertaxi direkt vom Hotel zur Messe anreisen. Das angeschlossene Amtrium ist auf nachhaltige und grüne Events spezialisiert.",
      "cityInfo": "ca. 920.000 Einwohner | Gegründet 1300 | Hauptsächlich konfessionslos | ca. 42.000 Hotelzimmer. Sehenswert: Rijksmuseum, Anne-Frank-Haus, Grachtenring.",
      "hotels": "Das nhow Amsterdam Rai ist ein architektonisches Highlight direkt auf dem Gelände – ein dreieckiger, futuristischer Turm mit grandioser Aussicht.",
      "dining": "Das Restaurant Ciel Bleu (zwei Michelin-Sterne) im nahen Hotel Okura bietet fantastische Küche im 23. Stock.",
      "travel": "Die U-Bahn-Linie 52 (Nord-Süd-Linie) hält direkt an der Station \"Europaplein\" vor der Messe und verbindet das Gelände in weniger als 10 Minuten mit dem Amsterdamer Hauptbahnhof (Centraal)."
    },
    "id": "venue-24",
    "lat": 52.37,
    "lon": 4.9
  },
  {
    "number": 25,
    "city": "Utrecht",
    "venue": "Jaarbeurs",
    "facts": {
      "area": "ca. 100.000 m² Gesamtfläche. Das logistische Herz der niederländischen Binnenwirtschaft.",
      "insider": "Das Gelände ist direkt mit dem größten Bahnhof des Landes und dem Einkaufszentrum Hoog Catharijne verbunden. Sie können komplett wettergeschützt vom Zug bis in die Messehalle laufen.",
      "cityInfo": "ca. 365.000 Einwohner | Römische Gründung | Säkularisiert | ca. 4.000 Hotelzimmer. Sehenswert: Domturm, die einzigartigen Werftgrachten, Rietveld-Schröder-Haus.",
      "hotels": "Das Inntel Hotels Utrecht Centre liegt direkt am Bahnhof und bietet ein modernes, von der Stadtgeschichte inspiriertes Design.",
      "dining": "Das Restaurant Restaurant Tower bietet feine Küche mit Blick auf die Grachten. Für Bierliebhaber ist das Café Olivier (in einer ehemaligen Kirche) ein Muss.",
      "travel": "Reisen Sie unbedingt mit der Bahn an. Der Bahnhof Utrecht Centraal wird aus allen Richtungen (auch per ICE aus Deutschland) im Minutentakt angefahren. Von dort sind es nur wenige Schritte."
    },
    "id": "venue-25",
    "lat": 52.09,
    "lon": 5.12
  },
  {
    "number": 26,
    "city": "Posen",
    "venue": "MTP - Międzynarodowe Targi Poznańskie",
    "facts": {
      "area": "ca. 110.000 m² Gesamtfläche. Das geschichtsträchtigste und größte Messegelände in Polen.",
      "insider": "Das Gelände liegt mitten im Stadtzentrum. Das markanteste Gebäude ist der Spire (Zahn der Zeit), ein historischer Turm aus den 1920er Jahren, der weithin sichtbar ist.",
      "cityInfo": "ca. 535.000 Einwohner | 10. Jahrhundert | Römisch-katholisch | ca. 7.500 Hotelzimmer. Sehenswert: Alter Markt (Rathaus mit den Ziegenböcken), Posener Dom, Malta-See.",
      "hotels": "Das Sheraton Poznan Hotel liegt direkt gegenüber dem Messegelände und ist die erste Adresse für internationale Business-Gäste.",
      "dining": "Probieren Sie gehobene polnische Küche im Restaurant A職&A oder exzellente Steaks im Muga (Michelin-Stern).",
      "travel": "Da der Hauptbahnhof Poznań Główny direkt an das Messegelände angrenzt, ist die Anreise mit dem Eurocity aus Berlin (ca. 2,5 Stunden Fahrzeit) extrem komfortabel."
    },
    "id": "venue-26",
    "lat": 52.41,
    "lon": 16.93
  },
  {
    "number": 27,
    "city": "Brünn",
    "venue": "Veletrhy Brno",
    "facts": {
      "area": "ca. 135.000 m² Gesamtfläche. Gilt als eines der schönsten Messegelände Europas aufgrund seiner funktionalistischen Architektur aus den 1920er und 30er Jahren.",
      "insider": "Der Pavillon A mit seiner gewaltigen Parabel-Bogenkonstruktion steht unter Denkmalschutz und bietet eine grandiose Kulisse. Besuchen Sie das Messe-Museum, falls geöffnet.",
      "cityInfo": "ca. 390.000 Einwohner | Gegründet 1243 | Überwiegend konfessionslos | ca. 5.500 Hotelzimmer. Sehenswert: Villa Tugendhat, Festung Špilberk, St. Peter-und-Paul-Kathedrale.",
      "hotels": "Das Quality Hotel Brno Exhibition Centre liegt in unmittelbarer Nachbarschaft zum Gelände und bietet hervorragenden Service.",
      "dining": "Brünn hat eine der besten Café- und Barszenen Mitteleuropas. Gehen Sie für Cocktails in die legendäre Bar Který neexistuje (\"Die Bar, die es nicht gibt\").",
      "travel": "Die Straßenbahnlinien 1, 5 und 6 verbinden den Hauptbahnhof in wenigen Minuten mit dem Messegelände (Haltestelle Výstaviště)."
    },
    "id": "venue-27",
    "lat": 49.2,
    "lon": 16.61
  },
  {
    "number": 28,
    "city": "Lyon",
    "venue": "Eurexpo Lyon",
    "facts": {
      "area": "ca. 150.000 m² Gesamtfläche im Osten der französischen Kulinarik-Metropole.",
      "insider": "Das Gelände ist Austragungsort der Sirha (Weltgipfel der Gastronomie). Während dieses Events verwandelt sich das gesamte Gelände in eine Sterneküche. Die Hallen sind extrem breit und stützenfrei gebaut.",
      "cityInfo": "ca. 520.000 Einwohner | Antike Kolonie Lugdunum | Römisch-katholisch | ca. 18.000 Hotelzimmer. Sehenswert: Basilika Notre-Dame de Fourvière, Vieux Lyon (Altstadt), Parc de la Tête d'Or.",
      "hotels": "Das Hôtel Kyriad Prestige Lyon Est - Saint Priest liegt nahe dem Gelände. Im Zentrum logiert man herrschaftlich im InterContinental Lyon - Hotel Dieu.",
      "dining": "Besuchen Sie unbedingt ein traditionelles \"Bouchon Lyonnais\" (z.B. Café des Fédérations) für deftige, lokale Spezialitäten oder die berühmten Markthallen Halles de Lyon Paul Bocuse.",
      "travel": "Die Trambahnlinie T5 fährt während großer Messen direkt von der Metrostation \"Grange Blanche\" zum Haupteingang der Eurexpo."
    },
    "id": "venue-28",
    "lat": 45.76,
    "lon": 4.84
  },
  {
    "number": 29,
    "city": "Wien",
    "venue": "Messe Wien",
    "facts": {
      "area": "ca. 55.000 m² hochmoderne, kompakte Ausstellungsfläche direkt neben dem Wiener Prater.",
      "insider": "Das markante wellenförmige Stahldach des Kongresszentrums und der 26 Meter hohe Messeturm aus Glas sind die optischen Ankerpunkte. Das Areal ist extrem energieeffizient gebaut.",
      "cityInfo": "ca. 1.980.000 Einwohner | Römische Wurzeln | Römisch-katholisch & divers | ca. 38.000 Hotelzimmer. Sehenswert: Schloss Schönbrunn, Stephansdom, Hofburg.",
      "hotels": "Das Courtyard by Marriott Vienna Prater/Messe liegt unmittelbar neben dem Areal. Für ein hippes Erlebnis wählen Sie das Superbude Wien Prater.",
      "dining": "Für das klassische Wiener Schnitzel abseits der Touristenpfade empfiehlt sich das Gasthaus Wolf. Für den geschäftlichen Abend das Steirereck im Stadtpark (zwei Michelin-Sterne).",
      "travel": "Perfekte U-Bahn-Anbindung: Die Linie U2 hält direkt an den Stationen \"Messe-Prater\" (Hallen A und B) sowie \"Krieau\" (Hallen C und D)."
    },
    "id": "venue-29",
    "lat": 48.21,
    "lon": 16.37
  },
  {
    "number": 30,
    "city": "Lissabon",
    "venue": "FIL - Feira Internacional de Lisboa",
    "facts": {
      "area": "ca. 60.000 m² Gesamtfläche. Gelegen im hochmodernen Parque das Nações, dem ehemaligen Expo-98-Gelände.",
      "insider": "Das Gelände besteht aus vier großen, identischen Pavillons, die durch ein lichtes Vordach miteinander verbunden sind. Der Blick auf den Fluss Tejo und die Vasco-da-Gama-Brücke direkt vor der Halle ist spektakulär. Schauplatz des Web Summit.",
      "cityInfo": "ca. 545.000 Einwohner | Phönizische Gründung | Römisch-katholisch | ca. 25.000 Hotelzimmer. Sehenswert: Torre de Belém, Mosteiro dos Jerónimos, Alfama-Viertel.",
      "hotels": "Das Tivoli Oriente Lisboa Hotel bietet modernen Business-Komfort und eine großartige Rooftop-Bar direkt im Expo-Viertel.",
      "dining": "Essen Sie im Cantinho do Avillez von Portugals Starkoch José Avillez oder besuchen Sie den Time Out Market für eine riesige Auswahl an lokalen Spezialitäten.",
      "travel": "Nutzen Sie die rote Metro-Linie (Linha Vermelha) bis zur Station \"Oriente\". Der Bahnhof Gare do Oriente (entworfen von Santiago Calatrava) liegt nur 5 Gehminuten von der FIL entfernt und verbindet das Gelände auch direkt mit dem Flughafen."
    },
    "id": "venue-30",
    "lat": 38.72,
    "lon": -9.14
  },
  {
    "number": 31,
    "city": "Kopenhagen",
    "venue": "Bella Center",
    "facts": {
      "area": "ca. 65.000 m² Gesamtfläche. Das größte Kongress- und Ausstellungszentrum Skandinaviens, gelegen im modernen Stadtteil Ørestad.",
      "insider": "Das angeschlossene Hotel verfügt über zwei markante, dramatisch geneigte Türme. Das Bella Center setzt stark auf skandinavisches Design und Nachhaltigkeit – Einwegplastik sucht man hier vergeblich.",
      "cityInfo": "ca. 650.000 Einwohner | Gegründet 1167 | Evangelisch-lutherisch | ca. 22.000 Hotelzimmer. Sehenswert: Nyhavn, Tivoli, Die Kleine Meerjungfrau.",
      "hotels": "Das AC Hotel by Marriott Bella Sky Copenhagen ist direkt in den Messekomplex integriert und bietet einen unvergleichlichen Blick über Kopenhagen.",
      "dining": "Kopenhagen ist die Welthauptstadt der New Nordic Cuisine. Wenn Sie kein Ticket für das Noma ergattern, versuchen Sie es im fantastischen Restaurant Höst.",
      "travel": "Die fahrerlose Metro M1 hält direkt an der Station \"Bella Center\". Von dort sind es nur 15 Minuten bis ins Stadtzentrum und knapp 15 Minuten zum Flughafen per Bahn/Bus."
    },
    "id": "venue-31",
    "lat": 55.68,
    "lon": 12.57
  },
  {
    "number": 32,
    "city": "Stockholm",
    "venue": "Stockholmsmässan",
    "facts": {
      "area": "ca. 75.000 m² Gesamtfläche in Älvsjö, knapp südlich der Stockholmer Innenstadt.",
      "insider": "Die Messe ist bekannt für die Stockholm Furniture Fair. Der Eingangsbereich besticht durch eine riesige, wellenförmige Glasgalerie. Nutzen Sie die exzellenten, schwedischen Kaffeebars (\"Fika\") auf dem Gelände.",
      "cityInfo": "ca. 980.000 Einwohner | Gegründet 1252 | Säkularisiert-lutherisch | ca. 32.000 Hotelzimmer. Sehenswert: Gamla Stan, Vasa-Museum, ABBA-Museum.",
      "hotels": "Das Scandic Talk Hotel befindet sich direkt neben dem Messegelände und ist ideal auf Business-Reisende eingestellt.",
      "dining": "Hervorragende, moderne schwedische Küche gibt es im Restaurant Pelikan (Södermalm) oder für gehobene Anlässe im Operakällaren.",
      "travel": "Nehmen Sie die Pendeltåg (Vorortzug) vom Stockholmer Hauptbahnhof (T-Centralen) bis zur Station \"Älvsjö\". Die Fahrt dauert exakt 10 Minuten, die Züge fahren im dichten Takt."
    },
    "id": "venue-32",
    "lat": 59.33,
    "lon": 18.07
  },
  {
    "number": 33,
    "city": "Helsinki",
    "venue": "Messukeskus",
    "facts": {
      "area": "ca. 58.000 m² Ausstellungsfläche im Stadtteil Pasila.",
      "insider": "Jedes Jahr im Spätherbst findet hier das weltberühmte Start-up-Event Slush statt. Dann verwandeln sich die Hallen in eine mystische, dunkel ausgeleuchtete Kulisse mit Lasershows und Nebelmaschinen.",
      "cityInfo": "ca. 660.000 Einwohner | Gegründet 1550 | Evangelisch-lutherisch | ca. 12.000 Hotelzimmer. Sehenswert: Dom von Helsinki, Festung Suomenlinna, Felsenkirche.",
      "hotels": "Das Holiday Inn Helsinki - Expo ist direkt an das Messezentrum angeschlossen und bietet Gästen eine kostenlose, echt finnische Hotelsauna.",
      "dining": "Das Restaurant Savotta bietet traditionelle finnische Küche (Rentier, Bärenfleisch) direkt am Senatsplatz. Für moderne Fine-Dining-Konzepte empfiehlt sich das Demo.",
      "travel": "Alle Nahverkehrszüge vom Hauptbahnhof Helsinki halten am Bahnhof Pasila. Von dort führt ein kurzer, ausgeschilderter Fußweg direkt zum Messukeskus."
    },
    "id": "venue-33",
    "lat": 60.17,
    "lon": 24.94
  },
  {
    "number": 34,
    "city": "Athen",
    "venue": "Athens Metropolitan Expo",
    "facts": {
      "area": "ca. 50.000 m² hochmoderne Ausstellungsfläche, strategisch direkt am internationalen Flughafen Athen gelegen.",
      "insider": "Das Gelände ist einstöckig, extrem weitläufig und komplett barrierefrei. Es gilt als der logistisch am besten flugangebundene Messeplatz im östlichen Mittelmeerraum. Alle zwei Jahre Schauplatz der weltberühmten Schifffahrtsmesse Posidonia.",
      "cityInfo": "ca. 660.000 Einwohner (Großraum 3,5 Mio.) | Antike Metropole | Griechisch-orthodox | ca. 30.000 Hotelzimmer. Sehenswert: Akropolis, Parthenon, Plaka-Viertel.",
      "hotels": "Das Sofitel Athens Airport liegt direkt gegenüber dem Flughafenterminal und ist nur eine zweiminütige Shuttlefahrt von der Messe entfernt.",
      "dining": "Für fantastischen frischen Fisch mit Blick auf das Meer fahren Sie nach Mikrolimano (Piräus) in das Restaurant Varoulko Seaside (Michelin-Stern).",
      "travel": "Fliegen Sie einfach ein. Vom Flughafen Athen (ATH) gibt es während aller Messetage einen kostenlosen, permanenten Bus-Shuttle direkt zu den Halleneingängen."
    },
    "id": "venue-34",
    "lat": 37.98,
    "lon": 23.72
  },
  {
    "number": 35,
    "city": "Istanbul",
    "venue": "Tüyap Fair Convention and Congress Center",
    "facts": {
      "area": "ca. 125.000 m² Gesamtfläche im Stadtteil Büyükçekmece auf der europäischen Seite der Metropole.",
      "insider": "Da das Tüyap-Gelände recht weit außerhalb des historischen Zentrums liegt, sollten Sie Staus akribisch einplanen. Das Areal verfügt über ein exzellentes, eigenes Business-Zentrum für internationale Verträge.",
      "cityInfo": "ca. 15.800.000 Einwohner | Gegründet ca. 660 v. Chr. | Islamisch geprägt | ca. 95.000 Hotelzimmer. Sehenswert: Hagia Sophia, Topkapı-Palast, Großer Basar.",
      "hotels": "Das Tüyap Palas ist direkt in den Messekomplex integriert – die sicherste Option, um dem mörderischen Istanbuler Berufsverkehr zu entgehen.",
      "dining": "Für ein unvergessliches Abendessen am Bosporus empfiehlt sich das Restaurant Sunset Grill & Bar oder das traditionsreiche Pandeli im Ägyptischen Basar.",
      "travel": "Die beste und staubefreite Option ist die Nutzung des Metrobus (Schnellbusse auf eigener Spur) bis zur Endstation \"Tüyap\". Eine Taxifahrt aus der Innenstadt (Taksim) kann zu Stoßzeiten über zwei Stunden dauern."
    },
    "id": "venue-35",
    "lat": 41.01,
    "lon": 28.98
  },
  {
    "number": 36,
    "city": "Moskau",
    "venue": "Crocus Expo International Exhibition Center",
    "facts": {
      "area": "ca. 701.000 m² Gesamtfläche (davon 366.100 m² überdachte Hallenfläche). Eines der größten und modernsten Messezentren weltweit, gelegen im Vorort Krasnogorsk.",
      "insider": "Das Crocus-Gelände ist eine eigene Stadt in der Stadt. Es verfügt über drei gigantische Pavillons, die intern durch verglaste Passagen mit Fahrsteigen verbunden sind. Hier ist alles auf monumentale Größe ausgelegt.",
      "cityInfo": "ca. 13.000.000 Einwohner | Gegründet 1147 | Russisch-orthodox | ca. 60.000 Hotelzimmer. Sehenswert: Roter Platz, Kreml, Basilius-Kathedrale.",
      "hotels": "Das Aquarium Hotel befindet sich direkt im Pavillon 3 der Crocus Expo – ideal, um die Kälte im russischen Winter komplett zu umgehen.",
      "dining": "Für ein historisches und luxuriöses Business-Dinner empfiehlt sich das legendäre Café Puschkin. Moderne russische Küche auf Weltniveau bietet das White Rabbit (spektakuläre Glaskuppel).",
      "travel": "Die Moskauer Metro verfügt über eine eigene Station direkt auf dem Gelände: \"Myakinino\" (Blaue Linie 3). Dies ist die mit Abstand schnellste und zuverlässigste Transportmöglichkeit."
    },
    "id": "venue-36",
    "lat": 55.75,
    "lon": 37.62
  },
  {
    "number": 37,
    "city": "Moskau",
    "venue": "Expocentre Krasnaya Presnya",
    "facts": {
      "area": "ca. 165.000 m² Gesamtfläche, direkt neben dem futuristischen Wolkenkratzer-Viertel Moscow City am Ufer des Moskwa-Flusses gelegen.",
      "insider": "Das Expocentre ist das traditionsreiche, zentralere Messegelände Moskaus. Der Pavillon 1 besticht durch seine markante, hängende Dachkonstruktion. Nach der Messe ist man sofort im Finanzzentrum der Stadt.",
      "cityInfo": "Siehe Moskau (oben). Weitere Highlights: Gorki-Park, Bolschoi-Theater, Tretjakow-Galerie.",
      "hotels": "Das Novotel Moscow City liegt mitten im benachbarten Wolkenkratzerkomplex und ist nur wenige Gehminuten entfernt.",
      "dining": "Das Restaurant Ruski im 85. Stock des OKO-Towers bietet traditionelle Küche und verfügt über eine echte Eis-Bar.",
      "travel": "Nutzen Sie die Metro bis zur Station \"Vystavochnaya\" oder \"Delovoy Tsentr\". Perfekt zentrale Lage."
    },
    "id": "venue-37",
    "lat": 55.75,
    "lon": 37.62
  },
  {
    "number": 38,
    "city": "Sankt Petersburg",
    "venue": "Expoforum",
    "facts": {
      "area": "ca. 100.000 m² hochmoderne Ausstellungsfläche, unweit des Flughafens Pulkowo gelegen. Schauplatz des jährlichen St. Petersburg International Economic Forum (SPIEF).",
      "insider": "Das Gelände wurde komplett im futuristischen Stil neu erbaut. Die Hallen sind vollkommen säulenfrei und weisen Deckenhöhen von bis zu 18 Metern auf. Auf dem Gelände befindet sich zudem die wunderschöne, rekonstruierte Kirche der Gottesmutter von Pulkowo.",
      "cityInfo": "ca. 5.600.000 Einwohner | Gegründet 1703 durch Peter den Großen | Russisch-orthodox | ca. 25.000 Hotelzimmer. Sehenswert: Eremitage, Peter-und-Paul-Festung, Peterhof.",
      "hotels": "Das Hilton Saint Petersburg Expoforum befindet sich direkt auf dem Messegelände und bietet erstklassigen Komfort für Staatsgäste und Delegationen.",
      "dining": "Das Restaurant Palkin bietet russische Zarenküche in historischem Ambiente. Für moderne Konzepte empfiehlt sich das Harvest.",
      "travel": "Während Messen verkehren kostenlose Shuttle-Busse von den Metrostationen \"Moskovskaya\" und \"Ploshchad Vosstaniya\"."
    },
    "id": "venue-38",
    "lat": 59.94,
    "lon": 30.31
  },
  {
    "number": 39,
    "city": "Kiew",
    "venue": "IEC - International Exhibition Centre",
    "facts": {
      "area": "ca. 58.000 m² moderne Hallenfläche am linken Ufer des Dnjepr-Flusses.",
      "insider": "Das IEC ist der größte Messekomplex der Ukraine und war unter anderem Austragungsort des Eurovision Song Contest. Die Hallen sind architektonisch flexibel miteinander verbindbar.",
      "cityInfo": "ca. 2.950.000 Einwohner | Gegründet 482 | Ukrainisch-orthodox | ca. 12.000 Hotelzimmer. Sehenswert: Höhlenkloster (Petscherska Lawra), Sophienkathedrale, Majdan-Platz.",
      "hotels": "Das Tourist Hotel liegt nahe der Messe. Für Premium-Ansprüche empfiehlt sich das InterContinental Kyiv in der historischen Oberstadt.",
      "dining": "Probieren Sie echten ukrainischen Borschtsch und Kiewer Schnitzel im traditionellen Restaurant Kanapa im malerischen Andreasviertel.",
      "travel": "Die Metro-Station \"Livoberezhna\" (Rote Linie) liegt nur knapp 10 Gehminuten vom Messegelände entfernt und bietet eine direkte Verbindung ins Stadtzentrum."
    },
    "id": "venue-39",
    "lat": 50.45,
    "lon": 30.52
  },
  {
    "number": 40,
    "city": "Belgrad",
    "venue": "Beogradski Sajam",
    "facts": {
      "area": "ca. 100.000 m² Gesamtfläche am Ufer der Save. Ein Meilenstein der sozialistischen Moderne.",
      "insider": "Die Halle 1 ist eine weltweite Sensation der Ingenieurskunst: Sie verfügt über die größte freitragende Kuppel aus Spannbeton weltweit (109 Meter Durchmesser). Das Raumerlebnis im Inneren ist monumental.",
      "cityInfo": "ca. 1.400.000 Einwohner | Antike Wurzeln | Serbisch-orthodox | ca. 9.000 Hotelzimmer. Sehenswert: Festung von Belgrad (Kalemegdan), Kirche des Heiligen Sava, Skadarlija-Viertel.",
      "hotels": "Das Radisson Collection Hotel, Old Mill Belgrade liegt strategisch perfekt ganz in der Nähe der Messe in einer liebevoll restaurierten historischen Mühle.",
      "dining": "Besuchen Sie das Restaurant Ambar im hippen Viertel Beton Hala am Flussufer für moderne, Balkan-Spezialitäten im Tapas-Stil.",
      "travel": "Belgrad hat derzeit kein U-Bahn-System. Nutzen Sie die Tramlinien 3, 12 und 13 oder Taxis, um direkt zum Messegelände am Fluss zu gelangen."
    },
    "id": "venue-40",
    "lat": 44.81,
    "lon": 20.46
  },
  {
    "number": 41,
    "city": "Bukarest",
    "venue": "Romexpo",
    "facts": {
      "area": "ca. 100.000 m² Ausstellungsfläche im Norden der rumänischen Hauptstadt.",
      "insider": "Das markanteste Gebäude ist der zentrale, kuppelförmige Pavillon (Pavilionul Central), der stark an das Brüsseler Atomium-Umfeld erinnert und immense Deckenhöhen für Großexponate bietet.",
      "cityInfo": "ca. 1.800.000 Einwohner | Gegründet 1459 | Rumänisch-orthodox | ca. 11.000 Hotelzimmer. Sehenswert: Parlamentspalast (zweitgrößtes Gebäude der Welt), Triumphbogen, Altstadt (Lipscani).",
      "hotels": "Das Crowne Plaza Bucharest liegt direkt neben dem Romexpo-Gelände in einer ruhigen Parkanlage.",
      "dining": "Das riesige, historische Wirtshaus Caru' cu Bere in der Altstadt bietet traditionelle rumänische Gerichte und selbstgebrautes Bier in spektakulärer Neugotik-Kulisse.",
      "travel": "Vom Flughafen Otopeni (OTP) gelangt man per Taxi oder Express-Bus 783 schnell zum Romexpo-Areal im Norden."
    },
    "id": "venue-41",
    "lat": 44.43,
    "lon": 26.1
  },
  {
    "number": 42,
    "city": "Zagreb",
    "venue": "Zagrebački Velesajam",
    "facts": {
      "area": "ca. 135.000 m² Ausstellungsfläche im Stadtteil Novi Zagreb, südlich der Save.",
      "insider": "Das Gelände war während des Kalten Krieges ein historischer Treffpunkt zwischen Ost und West. Einige der Pavillons weisen charmante, zeithistorische Architekturmerkmale der Nachkriegsmoderne auf.",
      "cityInfo": "ca. 770.000 Einwohner | Gegründet 1094 | Römisch-katholisch | ca. 5.500 Hotelzimmer. Sehenswert: Kathedrale von Zagreb, Markusplatz, Museum der zerbrochenen Beziehungen.",
      "hotels": "Das Hotel Antunović bietet guten Business-Standard. Im Zentrum logiert man im legendären Jugendstil-Hotel Esplanade Zagreb.",
      "dining": "Das Restaurant Zinfandel's im Esplanade bietet Spitzenküche. Für lokale Spezialitäten empfiehlt sich das Stari Fijaker.",
      "travel": "Die Tramlinien 7 und 14 verbinden das Stadtzentrum direkt mit der Haltestelle \"Velesajam\" vor dem Messegelände."
    },
    "id": "venue-42",
    "lat": 45.81,
    "lon": 15.98
  },
  {
    "number": 43,
    "city": "Budapest",
    "venue": "Hungexpo",
    "facts": {
      "area": "ca. 70.000 m² Hallenfläche, eingebettet in ein weitläufiges, grünes Parkareal im Osten der Stadt.",
      "insider": "Das Gelände wurde komplett modernisiert. Das neue, kreisrunde Kongresszentrum besticht durch eine spektakuläre Glasfassade und modernste LED-Technik.",
      "cityInfo": "ca. 1.700.000 Einwohner | Gegründet 1873 (Zusammenlegung von Buda und Pest) | Katholisch & calvinistisch | ca. 24.000 Hotelzimmer. Sehenswert: Parlamentsgebäude, Fischerbastei, Széchenyi-Heilbad.",
      "hotels": "Das Expo Congress Hotel befindet sich direkt am Haupteingang der Hungexpo und bietet eine gemütliche Lobbybar für Business-Gespräche.",
      "dining": "Für das traditionelle Gulasch auf Top-Niveau: Das Restaurant Gundel. Wer ein hippes Ambiente sucht, besucht danach die berühmten Ruinenbars (z.B. Szimpla Kert).",
      "travel": "Nehmen Sie die Metro-Linie M2 bis zur Station \"Puskás Ferenc Stadion\" und steigen Sie dort in den moped-artig getakteten Messe-Busbahnhof um."
    },
    "id": "venue-43",
    "lat": 47.5,
    "lon": 19.04
  },
  {
    "number": 44,
    "city": "Nitra",
    "venue": "Agrokomplex",
    "facts": {
      "area": "ca. 60.000 m² Hallenkapazität plus ein riesiges landwirtschaftliches Freigelände mit integriertem Freilichtmuseum.",
      "insider": "Dies ist das unangefochtene Zentrum für Agrar- und Maschinenbaumessen in der Slowakei. Auf dem Gelände verkehrt eine historische Feldbahn für Besucher, um die weiten Wege zu verkürzen.",
      "cityInfo": "ca. 76.000 Einwohner | Eine der ältesten Städte der Slowakei | Römisch-katholisch | ca. 1.500 Hotelzimmer. Sehenswert: Burg Nitra, St.-Emmeram-Kathedrale, Synagoge.",
      "hotels": "Das Hotel Grand Hotel Centro bietet gehobenen Komfort im Stadtzentrum.",
      "dining": "Das Restaurant Zlatý Klúčik auf dem Zobor-Hügel bietet feine Küche und einen phänomenalen Panoramablick über die gesamte Messestadt.",
      "travel": "Nitra ist am besten über die Autobahn R1 per Auto oder mit direkten Busverbindungen aus Bratislava (ca. 1 Stunde Fahrzeit) zu erreichen."
    },
    "id": "venue-44",
    "lat": 48.31,
    "lon": 18.09
  },
  {
    "number": 45,
    "city": "Graz",
    "venue": "Messe Congress Graz",
    "facts": {
      "area": "ca. 40.000 m² Gesamtfläche. Das architektonische Prunkstück ist die Stadthalle Graz mit ihrem weit auskragenden, spektakulären Vordach.",
      "insider": "Die Hallen sind extrem eng mit dem historischen Congress-Zentrum verzahnt. Durch die urbane Lage mitten im Jakomini-Viertel ist man nach Messeschluss sofort im städtischen Leben.",
      "cityInfo": "ca. 295.000 Einwohner | UNESCO-Welterbe der Altstadt | Überwiegend katholisch | ca. 5.000 Hotelzimmer. Sehenswert: Schloßberg mit Uhrturm, Kunsthaus Graz (die \"Murinsel\").",
      "hotels": "Das Augarten Art Hotel liegt nur wenige Gehminuten entfernt und begeistert Kunstliebhaber durch hochwertige zeitgenössische Werke in allen Räumen.",
      "dining": "Steirische Schmankerl und das berühmte Kürbiskernöl genießt man im Traditionsbetrieb Der Steirer.",
      "travel": "Die Straßenbahnlinien 4, 5 und 13 fahren vom zentralen Jakominiplatz direkt vor den Haupteingang der Messe."
    },
    "id": "venue-45",
    "lat": 47.07,
    "lon": 15.44
  },
  {
    "number": 46,
    "city": "Genua",
    "venue": "Hierarchie-Ergänzung / Alternativstandort Südeuropa: Genua, Italien - Fiera di Genova",
    "facts": {
      "area": "ca. 70.000 m² Ausstellungsfläche, spektakulär direkt im Hafenbecken von Genau an der ligurischen Küste gelegen.",
      "insider": "Schauplatz der Salone Nautico (internationale Bootsmesse). Das absolute Highlight ist der von Jean Nouvel entworfene Pavillon B, eine riesige, blau spiegelnde Glashalle, in der sich das Meerwasser direkt bricht.",
      "cityInfo": "ca. 560.000 Einwohner | Historische Seerepublik | Römisch-katholisch | ca. 8.500 Hotelzimmer. Sehenswert: Aquarium Genua, Palazzi dei Rolli, Altstadt-Gassen (Caruggi).",
      "hotels": "Das Meliá Genova bietet luxuriösen, ruhigen Komfort im eleganten Carignano-Viertel, unweit des Hafengeländes.",
      "dining": "Essen Sie originale Pasta mit Pesto Genovese in der urigen Trattoria Rosmarino.",
      "travel": "Vom Bahnhof Genova Brignole sind es nur knapp 15 Gehminuten oder eine kurze Busfahrt bis zum Messegelände am Meer."
    },
    "id": "venue-46",
    "lat": 44.41,
    "lon": 8.93
  },
  {
    "number": 47,
    "city": "Vilnius",
    "venue": "Litexpo",
    "facts": {
      "area": "ca. 33.000 m² moderne Ausstellungsfläche im Westen der baltischen Metropole.",
      "insider": "Das Litexpo-Zentrum ist der größte und modernste Messeplatz in den baltischen Staaten. Es ist umgeben von malerischen Kiefernwäldern, was für eine außergewöhnlich ruhige Kulisse sorgt.",
      "cityInfo": "ca. 590.000 Einwohner | Größte barocke Altstadt Osteuropas | Römisch-katholisch | ca. 6.000 Hotelzimmer. Sehenswert: Gediminas-Turm, Tor der Morgenröte, Künstgerviertel Užupis.",
      "hotels": "Buchen Sie das luxuriöse Grand Hotel Kempinski Vilnius direkt am Kathedralenplatz im historischen Zentrum.",
      "dining": "Das Restaurant Ertlio Namas bietet ein einzigartiges Konzept: Historische litauische Küche des Adels aus dem 16.–19. Jahrhundert, modern interpretiert.",
      "travel": "Vom Flughafen Vilnius (VNO) bringen Sie Taxis oder Ride-Hailing-Dienste (Bolt) in knapp 15 Minuten direkt zum Litexpo-Gelände."
    },
    "id": "venue-47",
    "lat": 54.69,
    "lon": 25.28
  },
  {
    "number": 48,
    "city": "Plowdiw",
    "venue": "International Fair Plovdiv",
    "facts": {
      "area": "ca. 138.000 m² Gesamtfläche an beiden Ufern des Flusses Mariza. Einer der ältesten und traditionsreichsten Messeplätze auf dem Balkan.",
      "insider": "Das Areal ist parkähnlich angelegt. Die Pavillons weisen klassisch-monumentale Nachkriegsarchitektur auf. Das Gelände zieht vor allem schwere Industrie- und Landwirtschaftsmessen an.",
      "cityInfo": "ca. 345.000 Einwohner | Eine der ältesten kontinuierlich bewohnten Städte Europas | Bulgarisch-orthodox | ca. 3.500 Hotelzimmer. Sehenswert: Römisches Amphitheater, Altstadt-Architektur, Kapana-Kreativviertel.",
      "hotels": "Das Grand Hotel Plovdiv liegt direkt am Flussufer, unmittelbar gegenüber dem Haupteingang des Messegeländes.",
      "dining": "Das Restaurant Pavaj im Kapana-Viertel ist legendär für moderne bulgarische Küche – unbedingt den hausgemachten Rakia probieren.",
      "travel": "Plowdiw ist über die Autobahn Trakia perfekt an die Hauptstadt Sofia angebunden (ca. 1,5 Stunden Autofahrt)."
    },
    "id": "venue-48",
    "lat": 42.14,
    "lon": 24.75
  },
  {
    "number": 49,
    "city": "Ljubljana",
    "venue": "Gospodarsko Razstavišče",
    "facts": {
      "area": "ca. 25.000 m² Ausstellungsfläche im unmittelbaren Zentrum der grünen Hauptstadt.",
      "insider": "Die Hallen wurden in den 1950er Jahren von namhaften slowenischen Architekten entworfen und gelten als Paradebeispiele des regionalen Funktionalismus. Aufgrund der zentralen Lage kann man fast alles zu Fuß erledigen.",
      "cityInfo": "ca. 295.000 Einwohner | Grüne Hauptstadt Europas | Römisch-katholisch & säkular | ca. 4.500 Hotelzimmer. Sehenswert: Burg von Ljubljana, Drei Brücken (Tromostovje), Tivoli-Park.",
      "hotels": "Das InterContinental Ljubljana ist das höchste Hotel der Stadt und liegt nur 5 Gehminuten vom Messegelände entfernt.",
      "dining": "Spitzenküche aus lokalen, slowenischen Zutaten genießt im Restaurant Strelec direkt oben in der Burg.",
      "travel": "Da der Hauptbahnhof Ljubljana direkt um die Ecke liegt, ist die Anreise mit der Bahn die entspannteste Wahl."
    },
    "id": "venue-49",
    "lat": 46.06,
    "lon": 14.51
  },
  {
    "number": 50,
    "city": "Jekaterinburg",
    "venue": "Ekaterinburg-Expo",
    "facts": {
      "area": "ca. 90.000 m² hochmoderne Ausstellungsfläche weit im Osten an der geografischen Grenze zwischen Europa und Asien. Schauplatz der Industriemesse Innoprom.",
      "insider": "Dies ist der modernste Messekomplex im Ural-Raum, erbaut für globale Großveranstaltungen. Die gigantischen, futuristischen Glashallen trotzen selbst härtesten sibirischen Wintern mit Spezialheizungen im Fundament.",
      "cityInfo": "ca. 1.500.000 Einwohner | Gegründet 1723 durch Peter den Großen | Russisch-orthodox | ca. 12.000 Hotelzimmer. Sehenswert: Kirche auf dem Blut, Ipatjew-Haus-Gedenkstätte, Wolkenkratzer Wyssozki.",
      "hotels": "Das Angelo by Vienna House Ekaterinburg ist direkt mit dem Flughafen Koltsovo verbunden, von wo aus kostenlose Shuttles zur Expo fahren.",
      "dining": "Probieren Sie exzellente, sibirische Pelmeni (Teigtaschen) und Wildgerichte im Restaurant Troekurov.",
      "travel": "Der Flughafen Koltsovo (SVX) liegt strategisch extrem nah am Messegelände. Nutzen Sie die offiziellen Messe-Shuttles, um die weite Fahrt in das Stadtzentrum zu umgehen."
    },
    "id": "venue-50",
    "lat": 56.84,
    "lon": 60.61
  }
];
