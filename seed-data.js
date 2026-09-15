// Datos de ejemplo para poblar el muro cuando todavía no hay publicaciones reales.
// Se cargan con el botón "Cargar catálogo de ejemplo" en el muro vacío, atribuidos
// a un usuario de demostración (ownerId "demo"). No reemplazan contenido real de usuarios.
var seedInstruments = [
  {
    type:"Guitarra eléctrica", name:"Solaris Standard", brand:"",
    photoData:"img/strat.png",
    description:"La puerta de entrada al sonido Strat: liviana, versátil y lista para tu primer ensayo.",
    specs:[
      {label:"Cuerpo", value:"Tilo"}, {label:"Mástil", value:"Arce, perfil C"},
      {label:"Diapasón", value:"Palorrosa"}, {label:"Pastillas", value:"SSS — 3 single-coil cerámicos"},
      {label:"Puente", value:"Tremolo de 6 tornillos"}, {label:"Escala", value:"25.5\" (648 mm)"},
      {label:"Trastes", value:"21"}, {label:"Acabado", value:"Crema envejecida (relic)"}
    ], hotspots:[]
  },
  {
    type:"Guitarra eléctrica", name:"Solaris HSS", brand:"",
    photoData:"img/strat.png",
    description:"El clásico de tres cuernos, ahora con una humbucker en el puente para más potencia.",
    specs:[
      {label:"Cuerpo", value:"Aliso"}, {label:"Mástil", value:"Arce, perfil C"},
      {label:"Diapasón", value:"Arce"}, {label:"Pastillas", value:"HSS — 2 single-coil + 1 humbucker"},
      {label:"Puente", value:"Tremolo sincronizado"}, {label:"Escala", value:"25.5\" (648 mm)"},
      {label:"Trastes", value:"22"}, {label:"Acabado", value:"Crema envejecida (relic)"}
    ], hotspots:[]
  },
  {
    type:"Guitarra eléctrica", name:"Nightfall Junior", brand:"",
    photoData:"img/lp.png",
    description:"Todo el cuerpo y el calor de una Les Paul, en una versión pensada para empezar.",
    specs:[
      {label:"Cuerpo", value:"Caoba"}, {label:"Mástil", value:"Caoba"},
      {label:"Diapasón", value:"Palorrosa"}, {label:"Pastillas", value:"2 humbuckers cerámicos"},
      {label:"Puente", value:"Wraparound"}, {label:"Escala", value:"24.75\" (629 mm)"},
      {label:"Trastes", value:"22"}, {label:"Acabado", value:"Azul metálico"}
    ], hotspots:[]
  },
  {
    type:"Guitarra eléctrica", name:"Nightfall Custom", brand:"",
    photoData:"img/lp.png",
    description:"Peso, sustain y una voz media gruesa que corta cualquier mezcla.",
    specs:[
      {label:"Cuerpo", value:"Caoba con tapa de arce"}, {label:"Mástil", value:"Caoba, perfil redondeado"},
      {label:"Diapasón", value:"Palorrosa"}, {label:"Pastillas", value:"2 humbuckers pasivos"},
      {label:"Puente", value:"Tune-o-matic con cordal"}, {label:"Escala", value:"24.75\" (629 mm)"},
      {label:"Trastes", value:"22"}, {label:"Acabado", value:"Azul metálico"}
    ], hotspots:[]
  },
  {
    type:"Guitarra eléctrica", name:"Copperhead Starter", brand:"",
    photoData:"img/tele.jpg",
    description:"Simple, directa y confiable: la Tele de siempre a un precio de entrada.",
    specs:[
      {label:"Cuerpo", value:"Álamo"}, {label:"Mástil", value:"Arce, perfil C"},
      {label:"Diapasón", value:"Arce"}, {label:"Pastillas", value:"2 single-coil estándar"},
      {label:"Puente", value:"Fijo de 6 sillas"}, {label:"Escala", value:"25.5\" (648 mm)"},
      {label:"Trastes", value:"21"}, {label:"Acabado", value:"Ámbar acolchado (quilted)"}
    ], hotspots:[]
  },
  {
    type:"Guitarra eléctrica", name:"Copperhead Deluxe", brand:"",
    photoData:"img/tele.jpg",
    description:"El twang original: directa, brillante y sin vueltas.",
    specs:[
      {label:"Cuerpo", value:"Fresno"}, {label:"Mástil", value:"Arce, perfil C"},
      {label:"Diapasón", value:"Arce"}, {label:"Pastillas", value:"2 single-coil"},
      {label:"Puente", value:"Fijo de 3 sillas"}, {label:"Escala", value:"25.5\" (648 mm)"},
      {label:"Trastes", value:"21"}, {label:"Acabado", value:"Ámbar acolchado (quilted)"}
    ], hotspots:[]
  },
  {
    type:"Guitarra eléctrica", name:"Vórtice Mini", brand:"",
    photoData:"img/v.png",
    description:"La silueta más filosa del catálogo, ahora accesible para tu primera eléctrica agresiva.",
    specs:[
      {label:"Cuerpo", value:"Tilo"}, {label:"Mástil", value:"Arce"},
      {label:"Diapasón", value:"Palorrosa"}, {label:"Pastillas", value:"2 humbuckers pasivos"},
      {label:"Puente", value:"Tune-o-matic fijo"}, {label:"Escala", value:"25.5\" (648 mm)"},
      {label:"Trastes", value:"22"}, {label:"Acabado", value:"Blanco perla"}
    ], hotspots:[]
  },
  {
    type:"Guitarra eléctrica", name:"Vórtice V", brand:"",
    photoData:"img/v.png",
    description:"Pensada para el escenario: afinación estable y salida activa para distorsión alta.",
    specs:[
      {label:"Cuerpo", value:"Tilo"}, {label:"Mástil", value:"Arce, perfil delgado"},
      {label:"Diapasón", value:"Ébano"}, {label:"Pastillas", value:"2 humbuckers activos"},
      {label:"Puente", value:"Floyd Rose"}, {label:"Escala", value:"25.5\" (648 mm)"},
      {label:"Trastes", value:"24"}, {label:"Acabado", value:"Blanco perla"}
    ], hotspots:[]
  },
  {
    type:"Guitarra eléctrica", name:"Explorador Junior", brand:"",
    photoData:"img/explorer.png",
    description:"La misma silueta angular de los 70, en una versión liviana y accesible para empezar.",
    specs:[
      {label:"Cuerpo", value:"Tilo"}, {label:"Mástil", value:"Arce"},
      {label:"Diapasón", value:"Palorrosa"}, {label:"Pastillas", value:"2 humbuckers cerámicos"},
      {label:"Puente", value:"Tune-o-matic con cordal"}, {label:"Escala", value:"24.75\" (629 mm)"},
      {label:"Trastes", value:"22"}, {label:"Acabado", value:"Natural mate"}
    ], hotspots:[]
  },
  {
    type:"Guitarra eléctrica", name:"Explorador 76", brand:"",
    photoData:"img/explorer.png",
    description:"Silueta angular de los 70, calidez de caoba sólida de cuerpo a mástil.",
    specs:[
      {label:"Cuerpo", value:"Caoba"}, {label:"Mástil", value:"Caoba"},
      {label:"Diapasón", value:"Palorrosa"}, {label:"Pastillas", value:"2 humbuckers pasivos"},
      {label:"Puente", value:"Tune-o-matic con cordal"}, {label:"Escala", value:"24.75\" (629 mm)"},
      {label:"Trastes", value:"22"}, {label:"Acabado", value:"Natural mate"}
    ], hotspots:[]
  },
  {
    type:"Guitarra eléctrica", name:"Aurora Semihueca", brand:"",
    photoData:"img/semihollow.png",
    description:"Resonancia cálida de caja hueca con el control de una eléctrica sólida.",
    specs:[
      {label:"Cuerpo", value:"Laminado de arce, caja semihueca"}, {label:"Mástil", value:"Caoba"},
      {label:"Diapasón", value:"Palorrosa"}, {label:"Pastillas", value:"2 humbuckers pasivos"},
      {label:"Puente", value:"Tune-o-matic con cordal"}, {label:"Escala", value:"24.75\" (629 mm)"},
      {label:"Trastes", value:"22"}, {label:"Acabado", value:"Cereza translúcida"}
    ], hotspots:[]
  }
];
