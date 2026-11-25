const COMISIONES_OFICIALES = [
  "ORGANIZACIÓN",
  "AGITACION,PROPAGANDA Y COMUNICACIÓN",
  "ASUNTOS INTERNACIONALES",
  "ASUNTOS PARLAMENTARIOS",
  "ECONOMIA PRODUCTIVA Y FINANZAS",
  "ESTRATEGIA Y CRECIMIENTO ELECTORAL",
  "FORMACION POLITICA INTEGRAL",
  "JUVENTUD",
  "MOVILIZACION DE CALLE",
  "MOV. SOCIALES, PODER POPULAR Y GPPSB",
  "SEGURIDAD Y DEFENSA"
];

const MUNICIPIOS_DATA = [
  {
    mun: 1,
    nombre: "MP. BEJUMA",
    circuitos: [
      { codigo: "COM_070101001", nombre: "SUEÑOS DEL ARAÑERO DE BEJUMA" },
      { codigo: "COM_070101002", nombre: "EL DESPERTAR DEL PUEBLO REVOLUCIONARIO" },
      { codigo: "COM_070102001", nombre: "SIMON GIRAN" },
      { codigo: "COM_070103001", nombre: "MONTE SACRO" }
    ]
  },
  {
    mun: 2,
    nombre: "MP. CARLOS ARVELO",
    circuitos: [
      { codigo: "COM_070201001", nombre: "GUIGUE REVOLUCIONARIA" },
      { codigo: "COM_070201002", nombre: "DOCTOR CARLOS ARVELO" },
      { codigo: "COM_070201003", nombre: "EL LEGADO DE CHAVEZ Y JOSE FELIX RIBAS" },
      { codigo: "COM_070201004", nombre: "INDIO RANGEL" },
      { codigo: "COM_070201005", nombre: "COMANDANTE ETERNO" },
      { codigo: "COM_070201006", nombre: "BOLIVAR ZAMORA Y CHAVEZ" },
      { codigo: "COM_070202001", nombre: "BELEN DE LA SIERRA" },
      { codigo: "COM_070202002", nombre: "UNION REVOLUCIONARIA MANUARE" },
      { codigo: "COM_070203001", nombre: "FORTALEZA PRODUCTIVA COMUNALES" },
      { codigo: "COM_070203002", nombre: "EL BUEN VIVIR" },
      { codigo: "COM_070203003", nombre: "TACARIGUA" },
      { codigo: "COM_070203004", nombre: "NOGUERA CENTAURO" },
      { codigo: "COM_070203005", nombre: "ALIANZA REVOLUCIONARIA" },
      { codigo: "COM_070203006", nombre: "DIOSA DE TACARIGUA" },
      { codigo: "COM_070203007", nombre: "BOQUERON" }
    ]
  },
  {
    mun: 3,
    nombre: "MP. DIEGO IBARRA",
    circuitos: [
      { codigo: "COM_070301001", nombre: "CIRCUITO NUESTRO NORTE ES EL SUR 07-A" },
      { codigo: "COM_070301002", nombre: "CIRCUITO NUESTRO NORTE ES EL SUR 07-B" },
      { codigo: "COM_070301003", nombre: "COMUNA LOS TACARIGUA" },
      { codigo: "COM_070302001", nombre: "EL LEGADO DE BOLIVAR Y CHAVEZ" },
      { codigo: "COM_070302002", nombre: "EL FORTIN" },
      { codigo: "COM_070302003", nombre: "EL SUEÑO DEL LIDER HUGO CHAVEZ" },
      { codigo: "COM_070302004", nombre: "MARISCAL SUCRE" },
      { codigo: "COM_070302005", nombre: "NUESTRO NORTE ES EL SUR 07" }
    ]
  },
  {
    mun: 4,
    nombre: "MP. GUACARA",
    circuitos: [
      { codigo: "COM_070401001", nombre: "COMUNA SOCIALISTA CAMINO A LA VICTORIA" },
      { codigo: "COM_070401002", nombre: "COMUNA SOCIALISTA SUR SUENOS DEL COMANDANTE" },
      { codigo: "COM_070401003", nombre: "COMUNA SOCIALISTA TRIUNFADORES DEL SAMAN" },
      { codigo: "COM_070401004", nombre: "GUERRERA DE TACARIGUA" },
      { codigo: "COM_070401005", nombre: "COMUNA SOCIALISTA JOSE FELIX RAMIREZ" },
      { codigo: "COM_070401006", nombre: "SOCIALISTA AGRO TURISTICA BATALLA DE VIGIRIMA" },
      { codigo: "COM_070401007", nombre: "COMUNASOCIALISTA AGRICOLA Y TURISTICA PETROGLIFOS DE VIGIRIMA" },
      { codigo: "COM_070402001", nombre: "COMUNA SOCIALISTA ALIANZA DE LOS GUERREROS DE LA PATRIA" },
      { codigo: "COM_070403001", nombre: "COMUNA SOCIALISTA LAS FLORES DE YAGUA" }
    ]
  },
  {
    mun: 5,
    nombre: "MP. MONTALBAN",
    circuitos: [
      { codigo: "COM_070501001", nombre: "SOCIO PRODUCTIVA HIJOS E HIJAS DE BOLIVAR Y CHAVEZ" },
      { codigo: "COM_070501002", nombre: "AGRO TURISTICA LA ZURDA DE CHAVEZ" },
      { codigo: "COM_070501003", nombre: "SOCIO PRODUCTIVA COMANDANTE MAGOYA" }
    ]
  },
  {
    mun: 6,
    nombre: "MP. JUAN JOSE MORA",
    circuitos: [
      { codigo: "COM_070601001", nombre: "CHE GUEVARA LEGENDARIO SOCIALISTA" },
      { codigo: "COM_070601002", nombre: "SUEÑO DE CHAVEZ" },
      { codigo: "COM_070601003", nombre: "CORDILLERA DE JUAN JOSE MORA" },
      { codigo: "COM_070601004", nombre: "CIMARRON ANDRESOTE" },
      { codigo: "COM_070601005", nombre: "AGROTURISTICA SANTA CRUZ DE ALPARGATON" },
      { codigo: "COM_070601006", nombre: "SUEÑOS DE GRANDEZA BOLIVAR Y CHAVEZ" },
      { codigo: "COM_070601007", nombre: "EL DESPERTAR HEROICO DE PALMA SOLA" },
      { codigo: "COM_070602001", nombre: "CACIQUE URAMA" }
    ]
  },
  {
    mun: 7,
    nombre: "MP. PUERTO CABELLO",
    circuitos: [
      { codigo: "COM_070701001", nombre: "RIO AGUAS CALIENTES" },
      { codigo: "COM_070701002", nombre: "AGROTURISTICA E INDUSTRIAL EL CAMBUR" },
      { codigo: "COM_070702001", nombre: "PORTUARIA COMERCIAL TURISTICA Y PESQUERA UNION EN FRATERNIDAD" },
      { codigo: "COM_070703001", nombre: "AGRÍCOLA VENCEDORES DEL CAMPO" },
      { codigo: "COM_070703002", nombre: "CIRCUITO 3 PUERTO CABELLO" },
      { codigo: "COM_070703003", nombre: "COMUNA SOCIALISTA LOS LIDERES DE CHAVEZ" },
      { codigo: "COM_070703004", nombre: "SOCIO PRODUCTIVO AGRO INDUSTRIAL MEDARDO RODRIGUEZ SOMOS 13 EN REVOLUCION" },
      { codigo: "COM_070703005", nombre: "CON LUCES Y VIRTUDES SOMOS 11 EN CUMBOTO II HACIENDO PATRIA" },
      { codigo: "COM_070703006", nombre: "HIJOS DE UN LEGADO" },
      { codigo: "COM_070704001", nombre: "CIRCUITO 9 PUERTO CABELLO" },
      { codigo: "COM_070704002", nombre: "CIRCUITO 8 PUERTO CABELLO" },
      { codigo: "COM_070704003", nombre: "CIRCUITO 7 PUERTO CABELLO" },
      { codigo: "COM_070704004", nombre: "CIRCUITO 10 PUERTO CABELLO" },
      { codigo: "COM_070704005", nombre: "EL NUEVO RENACER DE HUGO CHAVEZ" },
      { codigo: "COM_070704006", nombre: "SOCIALISTA MORILLO LANCEROS" },
      { codigo: "COM_070704007", nombre: "LOS 10 CONSEJOS COMUNALES EN VICTORIA" },
      { codigo: "COM_070705001", nombre: "LAS 10 RAICES DE LA REVOLUCION" },
      { codigo: "COM_070705002", nombre: "CIRCUITO 6 PUERTO CABELLO" },
      { codigo: "COM_070705003", nombre: "AGROTURISTICA INDUSTRIAL GENERAL BARTOLOME SALOM" },
      { codigo: "COM_070705004", nombre: "CIRCUITO 4 PUERTO CABELLO" },
      { codigo: "COM_070705005", nombre: "CIRCUITO 5 PUERTO CABELLO" },
      { codigo: "COM_070707001", nombre: "CIRCUITO 1 PUERTO CABELLO" },
      { codigo: "COM_070708001", nombre: "CIRCUITO 2 PUERTO CABELLO" }
    ]
  },
  {
    mun: 8,
    nombre: "MP. SAN JOAQUIN",
    circuitos: [
      { codigo: "COM_070801001", nombre: "CENTRO ESTE LAGO LOS TACARIGUA" },
      { codigo: "COM_070801002", nombre: "CARABALI 01" },
      { codigo: "COM_070801003", nombre: "LOS TACARIGUA SUR" },
      { codigo: "COM_070801004", nombre: "SOCIALISTA CARABALI" },
      { codigo: "COM_070801005", nombre: "EL ORO DEL PUEBLO" }
    ]
  },
  {
    mun: 9,
    nombre: "MP. VALENCIA",
    circuitos: [
      { codigo: "COM_070901001", nombre: "SERRANIA INDIO GUACAMAYO" },
      { codigo: "COM_070902001", nombre: "MORREÑOS BOLIVARIANOS" },
      { codigo: "COM_070904001", nombre: "COMUNA SOCIALISTA Y PRODUCTIVA GUACAMAYA" },
      { codigo: "COM_070904002", nombre: "GENERAL MANUEL CEDEÑO" },
      { codigo: "COM_070904003", nombre: "CIRCUITO 3 VALENCIA" },
      { codigo: "COM_070904004", nombre: "ARGELIA LAYA 13" },
      { codigo: "COM_070904005", nombre: "CIRCUITO 6 VALENCIA" },
      { codigo: "COM_070904006", nombre: "EL PANAL 2021" },
      { codigo: "COM_070904007", nombre: "SOCIALISTA BOLIVAR Y SUCRE" },
      { codigo: "COM_070904008", nombre: "ECOSOCIALISTA 4 DE OCTUBRE 2012" },
      { codigo: "COM_070904009", nombre: "EL ARBOL DE LAS 4 RAICES REVOLUCIONARIA" },
      { codigo: "COM_070904010", nombre: "A PASOS DE VENCEDORES POR EL SOCIALISMO" },
      { codigo: "COM_070904011", nombre: "RENACER DEL SUR SOCIALISTA" },
      { codigo: "COM_070904012", nombre: "SOCORRO BOLIVARIANO" },
      { codigo: "COM_070904013", nombre: "CREACION DE CHAVEZ" },
      { codigo: "COM_070904014", nombre: "LA BATALLA PERFECTA DE CHAVEZ" },
      { codigo: "COM_070904015", nombre: "CIRCUITO 2 VALENCIA" },
      { codigo: "COM_070904016", nombre: "POR AMOR A BOLIVAR Y CHAVEZ INVICTOS" },
      { codigo: "COM_070904017", nombre: "HUGO CHAVEZ" },
      { codigo: "COM_070904018", nombre: "COMUNA SOCIALISTA GUERRERAS DE MAISANTA" },
      { codigo: "COM_070904019", nombre: "SOCIALISTA JOSE MARTI." },
      { codigo: "COM_070904020", nombre: "JUAN GERMAN ROSCIO" },
      { codigo: "COM_070904021", nombre: "COMUNA GUERRERAS Y GUERREROS DE GUAICAIPURO" },
      { codigo: "COM_070904022", nombre: "AGRICOLA COMANDANTE ELIEZER OTAIZA" },
      { codigo: "COM_070904023", nombre: "CUATRO DE FEBRERO" },
      { codigo: "COM_070904618", nombre: "DISCIPULOS DE BOLIVAR" },
      { codigo: "COM_070905001", nombre: "GLORIOSA PUERTA DE VALENCIA" },
      { codigo: "COM_070906001", nombre: "CIRCUITO 9 VALENCIA" },
      { codigo: "COM_070907001", nombre: "EL ARAÑERO DE SABANETA 2018" },
      { codigo: "COM_070907002", nombre: "CIRCUITO 4 VALENCIA" },
      { codigo: "COM_070907003", nombre: "BOLIVAR CHAVEZ" },
      { codigo: "COM_070908001", nombre: "COMUNA SOCIALISTA TACARIGUA SUELO DE ESPERANZA" },
      { codigo: "COM_070908002", nombre: "SOCIALISTA LAS PALMITAS" },
      { codigo: "COM_070908003", nombre: "CIRCUITO URB ISABELICA" },
      { codigo: "COM_070908004", nombre: "VIVIRAS POR SIEMPRE" },
      { codigo: "COM_070908005", nombre: "CIRCUITO 10" },
      { codigo: "COM_070908006", nombre: "GRAN COMUNA FLOR AMARILLO" },
      { codigo: "COM_070908007", nombre: "SOCIALISTA INDIA APACUANA" },
      { codigo: "COM_070908008", nombre: "COMUNA SOCIALISTA AGRO-URBANA CIUDAD PLAZA" },
      { codigo: "COM_070908009", nombre: "POR LA PAZ Y LA VIDA" },
      { codigo: "COM_070908010", nombre: "SOCIALISTA VINICIA OROZCO" },
      { codigo: "COM_070908011", nombre: "CIUDAD CHAVEZ" },
      { codigo: "COM_070908012", nombre: "COMUNIDAD INDIGENA" },
      { codigo: "COM_070908609", nombre: "EL SUR EXISTE" },
      { codigo: "COM_070908627", nombre: "CIRCUITO URB PARQUE VALENCIA" },
      { codigo: "COM_070908641", nombre: "CIRCUITO 7 VALENCIA LOS SAMANES" },
      { codigo: "COM_070908651", nombre: "AGRO SOCIALISTA JESUCRISTO BOLIVAR Y CHAVEZ" },
      { codigo: "COM_070909601", nombre: "AGROPECUARIA NEGRO PRIMERO" }
    ]
  },
  {
    mun: 10,
    nombre: "MP. MIRANDA",
    circuitos: [
      { codigo: "COM_071001001", nombre: "RIO ONOTO" },
      { codigo: "COM_071001002", nombre: "SOCIALISTA MANUEL CEDEÑO" },
      { codigo: "COM_071001003", nombre: "CHAVEZ ES NUESTRO" }
    ]
  },
  {
    mun: 11,
    nombre: "MP. LOS GUAYOS",
    circuitos: [
      { codigo: "COM_071101001", nombre: "SOCIALISTA VENCEDORES DE LA PATRIA" },
      { codigo: "COM_071101002", nombre: "BATALLA DE PICHINCHA- 24" },
      { codigo: "COM_071101003", nombre: "CHAVEZ VIVE XI" },
      { codigo: "COM_071101004", nombre: "SOCIALISTA 8VA ESTRELLA" },
      { codigo: "COM_071101005", nombre: "SOCIALISTA INDIOS CARIBE" },
      { codigo: "COM_071101006", nombre: "AGROSOCIALISTA ARGIMIRO GABALDON" },
      { codigo: "COM_071101007", nombre: "BATALLA DE AYACUCHO" },
      { codigo: "COM_071101008", nombre: "HIJOS DE BOLIVAR" },
      { codigo: "COM_071101009", nombre: "BATALLA DE JUNIN" },
      { codigo: "COM_071101010", nombre: "FORTALEZA REVOLUCIONARIA" },
      { codigo: "COM_071101011", nombre: "CIRCUITO 8 VALENCIA" }
    ]
  },
  {
    mun: 12,
    nombre: "MP. NAGUANAGUA",
    circuitos: [
      { codigo: "COM_071201001", nombre: "GENERAL ATANASIO GIRARDOT" },
      { codigo: "COM_071201002", nombre: "CIRCUITO SABANA DE LOS RIOS" },
      { codigo: "COM_071201003", nombre: "CIRCUITO COMANDANTE SUPREMO" },
      { codigo: "COM_071201004", nombre: "CIRCUITO BICENTENARIA BATALLA DE CARABOBO" },
      { codigo: "COM_071201005", nombre: "CIRCUITO CACIQUE PARAMACAY" },
      { codigo: "COM_071201006", nombre: "CIRCUITO GENERAL HEMOGENES LOPEZ" },
      { codigo: "COM_071201007", nombre: "NAGUANAGUA OESTE" },
      { codigo: "COM_071201008", nombre: "NAGUANAGUA NORTE" },
      { codigo: "COM_071201009", nombre: "5RAICES" },
      { codigo: "COM_071201010", nombre: "CIRCUITO LA SIEMBRA DEL COMANDANTE" },
      { codigo: "COM_071201011", nombre: "LAS TRINCHERAS" },
      { codigo: "COM_071201012", nombre: "CIRCUITO BATALLA DE BOMBONA" }
    ]
  },
  {
    mun: 13,
    nombre: "MP. SAN DIEGO",
    circuitos: [
      { codigo: "COM_071301001", nombre: "GRAN CACIQUE QUEIPA" },
      { codigo: "COM_071301002", nombre: "LA CUMACA DE LOS ARAWUACOS" },
      { codigo: "COM_071301003", nombre: "EL RENACER DEL COMANDANTE EN SAN DIEGO" },
      { codigo: "COM_071301004", nombre: "PRODUCCION REVOLUCIONARIA DEL SUR DE SAN DIEGO" },
      { codigo: "COM_071301005", nombre: "CIRCUITO 2 SAN DIEGO" },
      { codigo: "COM_071301006", nombre: "COMUNA ESMERALDA BOLIVARIANA" },
      { codigo: "COM_071301007", nombre: "CIRCUITO 1 SAN DIEGO" },
      { codigo: "COM_071301008", nombre: "FE LUZ Y ESPERANZA" }
    ]
  },
  {
    mun: 14,
    nombre: "MP. LIBERTADOR",
    circuitos: [
      { codigo: "COM_071401001", nombre: "LOS GRANDES ILUSTRES" },
      { codigo: "COM_071401002", nombre: "LA TRINIDAD 19-13" },
      { codigo: "COM_071401003", nombre: "TIERRA DE LIBERTADORES Y PRODUCTORES" },
      { codigo: "COM_071401004", nombre: "LA VICTORIA" },
      { codigo: "COM_071401005", nombre: "EL GIGANTE DE AMÉRICA HUGO CHAVEZ" },
      { codigo: "COM_071401006", nombre: "YUSBELI RAMOS" },
      { codigo: "COM_071401007", nombre: "PENSAMIENTOS Y SUEÑOS DE SIMON BOLIVAR" },
      { codigo: "COM_071401008", nombre: "BATALLA BICENTENARIA" },
      { codigo: "COM_071401009", nombre: "PATRIA EN REVOLUCION" },
      { codigo: "COM_071401010", nombre: "ARBOL DE LAS TRES RAICES" },
      { codigo: "COM_071401011", nombre: "FUNDO LA ESPERANZA" },
      { codigo: "COM_071401612", nombre: "SEMILLAS DEL COMANDANTE" },
      { codigo: "COM_071402001", nombre: "NUEVA BATALLA DE CARABOBO" },
      { codigo: "COM_071402002", nombre: "FABRICIO OJEDA" },
      { codigo: "COM_071402003", nombre: "BRISAS DEL CAMPO" },
      { codigo: "COM_071402004", nombre: "TENIENTE CORONEL JULIAN MELLADO" }
    ]
  }
];

function parseComisionAsistenciaNum(val) {
  if (val === 'X' || val === 'x') return 1;
  const n = parseInt(val, 10);
  return !isNaN(n) && n > 0 ? n : 0;
}

function createInitialComisionesState() {
  return COMISIONES_OFICIALES.map(nombre => ({
    nombre,
    asistio: 0,
    propuesta: ''
  }));
}

function countComisionesAsistentes(comisiones) {
  if (!Array.isArray(comisiones)) return 0;
  return comisiones.reduce((sum, c) => sum + parseComisionAsistenciaNum(c && c.asistio), 0);
}

function formatComisionesAsistentesText(comisiones) {
  if (!Array.isArray(comisiones)) return '';
  return comisiones
    .filter(c => parseComisionAsistenciaNum(c && c.asistio) > 0)
    .map(c => `${c.nombre} (${parseComisionAsistenciaNum(c.asistio)})`)
    .join(', ');
}

function formatPropuestasPorComisionText(comisiones) {
  if (!Array.isArray(comisiones)) return '';
  return comisiones
    .filter(c => c && c.propuesta && String(c.propuesta).trim() !== '')
    .map(c => `[${c.nombre}]: ${String(c.propuesta).trim()}`)
    .join(' | ');
}

window.parseComisionAsistenciaNum = parseComisionAsistenciaNum;
window.createInitialComisionesState = createInitialComisionesState;
window.countComisionesAsistentes = countComisionesAsistentes;
window.formatComisionesAsistentesText = formatComisionesAsistentesText;
window.formatPropuestasPorComisionText = formatPropuestasPorComisionText;
