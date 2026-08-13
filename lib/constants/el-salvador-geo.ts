export interface DistrictGeo {
  id: string;
  name: string;
}

export interface MunicipalityGeo {
  id: string;
  name: string;
  districts: DistrictGeo[];
}

export interface DepartmentGeo {
  id: string;
  name: string;
  municipalities: MunicipalityGeo[];
}

/** Catálogo oficial post-reforma (Decreto Legislativo 762): 14 departamentos, 44 municipios, 262 distritos. */
export const EL_SALVADOR_GEO: DepartmentGeo[] = [
  {
    "id": "AH",
    "name": "Ahuachapán",
    "municipalities": [
      {
        "id": "AH-AHUACHAPAN-NORTE",
        "name": "Ahuachapán Norte",
        "districts": [
          {
            "id": "AH-AHUACHAPAN-NORTE-01",
            "name": "Atiquizaya"
          },
          {
            "id": "AH-AHUACHAPAN-NORTE-02",
            "name": "El Refugio"
          },
          {
            "id": "AH-AHUACHAPAN-NORTE-03",
            "name": "San Lorenzo"
          },
          {
            "id": "AH-AHUACHAPAN-NORTE-04",
            "name": "Turín"
          }
        ]
      },
      {
        "id": "AH-AHUACHAPAN-CENTRO",
        "name": "Ahuachapán Centro",
        "districts": [
          {
            "id": "AH-AHUACHAPAN-CENTRO-01",
            "name": "Ahuachapán"
          },
          {
            "id": "AH-AHUACHAPAN-CENTRO-02",
            "name": "Apaneca"
          },
          {
            "id": "AH-AHUACHAPAN-CENTRO-03",
            "name": "Concepción de Ataco"
          },
          {
            "id": "AH-AHUACHAPAN-CENTRO-04",
            "name": "Tacuba"
          }
        ]
      },
      {
        "id": "AH-AHUACHAPAN-SUR",
        "name": "Ahuachapán Sur",
        "districts": [
          {
            "id": "AH-AHUACHAPAN-SUR-01",
            "name": "Guaymango"
          },
          {
            "id": "AH-AHUACHAPAN-SUR-02",
            "name": "Jujutla"
          },
          {
            "id": "AH-AHUACHAPAN-SUR-03",
            "name": "San Francisco Menéndez"
          },
          {
            "id": "AH-AHUACHAPAN-SUR-04",
            "name": "San Pedro Puxtla"
          }
        ]
      }
    ]
  },
  {
    "id": "SS",
    "name": "San Salvador",
    "municipalities": [
      {
        "id": "SS-SAN-SALVADOR-NORTE",
        "name": "San Salvador Norte",
        "districts": [
          {
            "id": "SS-SAN-SALVADOR-NORTE-01",
            "name": "Aguilares"
          },
          {
            "id": "SS-SAN-SALVADOR-NORTE-02",
            "name": "El Paisnal"
          },
          {
            "id": "SS-SAN-SALVADOR-NORTE-03",
            "name": "Guazapa"
          }
        ]
      },
      {
        "id": "SS-SAN-SALVADOR-OESTE",
        "name": "San Salvador Oeste",
        "districts": [
          {
            "id": "SS-SAN-SALVADOR-OESTE-01",
            "name": "Apopa"
          },
          {
            "id": "SS-SAN-SALVADOR-OESTE-02",
            "name": "Nejapa"
          }
        ]
      },
      {
        "id": "SS-SAN-SALVADOR-ESTE",
        "name": "San Salvador Este",
        "districts": [
          {
            "id": "SS-SAN-SALVADOR-ESTE-01",
            "name": "Ilopango"
          },
          {
            "id": "SS-SAN-SALVADOR-ESTE-02",
            "name": "San Martín"
          },
          {
            "id": "SS-SAN-SALVADOR-ESTE-03",
            "name": "Soyapango"
          },
          {
            "id": "SS-SAN-SALVADOR-ESTE-04",
            "name": "Tonacatepeque"
          }
        ]
      },
      {
        "id": "SS-SAN-SALVADOR-CENTRO",
        "name": "San Salvador Centro",
        "districts": [
          {
            "id": "SS-SAN-SALVADOR-CENTRO-01",
            "name": "Ayutuxtepeque"
          },
          {
            "id": "SS-SAN-SALVADOR-CENTRO-02",
            "name": "Mejicanos"
          },
          {
            "id": "SS-SAN-SALVADOR-CENTRO-03",
            "name": "San Salvador"
          },
          {
            "id": "SS-SAN-SALVADOR-CENTRO-04",
            "name": "Cuscatancingo"
          },
          {
            "id": "SS-SAN-SALVADOR-CENTRO-05",
            "name": "Ciudad Delgado"
          }
        ]
      },
      {
        "id": "SS-SAN-SALVADOR-SUR",
        "name": "San Salvador Sur",
        "districts": [
          {
            "id": "SS-SAN-SALVADOR-SUR-01",
            "name": "Panchimalco"
          },
          {
            "id": "SS-SAN-SALVADOR-SUR-02",
            "name": "Rosario de Mora"
          },
          {
            "id": "SS-SAN-SALVADOR-SUR-03",
            "name": "San Marcos"
          },
          {
            "id": "SS-SAN-SALVADOR-SUR-04",
            "name": "Santo Tomás"
          },
          {
            "id": "SS-SAN-SALVADOR-SUR-05",
            "name": "Santiago Texacuangos"
          }
        ]
      }
    ]
  },
  {
    "id": "LI",
    "name": "La Libertad",
    "municipalities": [
      {
        "id": "LI-LA-LIBERTAD-NORTE",
        "name": "La Libertad Norte",
        "districts": [
          {
            "id": "LI-LA-LIBERTAD-NORTE-01",
            "name": "Quezaltepeque"
          },
          {
            "id": "LI-LA-LIBERTAD-NORTE-02",
            "name": "San Matías"
          },
          {
            "id": "LI-LA-LIBERTAD-NORTE-03",
            "name": "San Pablo Tacachico"
          }
        ]
      },
      {
        "id": "LI-LA-LIBERTAD-CENTRO",
        "name": "La Libertad Centro",
        "districts": [
          {
            "id": "LI-LA-LIBERTAD-CENTRO-01",
            "name": "San Juan Opico"
          },
          {
            "id": "LI-LA-LIBERTAD-CENTRO-02",
            "name": "Ciudad Arce"
          }
        ]
      },
      {
        "id": "LI-LA-LIBERTAD-OESTE",
        "name": "La Libertad Oeste",
        "districts": [
          {
            "id": "LI-LA-LIBERTAD-OESTE-01",
            "name": "Colón"
          },
          {
            "id": "LI-LA-LIBERTAD-OESTE-02",
            "name": "Jayaque"
          },
          {
            "id": "LI-LA-LIBERTAD-OESTE-03",
            "name": "Sacacoyo"
          },
          {
            "id": "LI-LA-LIBERTAD-OESTE-04",
            "name": "Tepecoyo"
          },
          {
            "id": "LI-LA-LIBERTAD-OESTE-05",
            "name": "Talnique"
          }
        ]
      },
      {
        "id": "LI-LA-LIBERTAD-ESTE",
        "name": "La Libertad Este",
        "districts": [
          {
            "id": "LI-LA-LIBERTAD-ESTE-01",
            "name": "Antiguo Cuscatlán"
          },
          {
            "id": "LI-LA-LIBERTAD-ESTE-02",
            "name": "Huizúcar"
          },
          {
            "id": "LI-LA-LIBERTAD-ESTE-03",
            "name": "Nuevo Cuscatlán"
          },
          {
            "id": "LI-LA-LIBERTAD-ESTE-04",
            "name": "San José Villanueva"
          },
          {
            "id": "LI-LA-LIBERTAD-ESTE-05",
            "name": "Zaragoza"
          }
        ]
      },
      {
        "id": "LI-LA-LIBERTAD-COSTA",
        "name": "La Libertad Costa",
        "districts": [
          {
            "id": "LI-LA-LIBERTAD-COSTA-01",
            "name": "Chiltiupán"
          },
          {
            "id": "LI-LA-LIBERTAD-COSTA-02",
            "name": "Jicalapa"
          },
          {
            "id": "LI-LA-LIBERTAD-COSTA-03",
            "name": "La Libertad"
          },
          {
            "id": "LI-LA-LIBERTAD-COSTA-04",
            "name": "Tamanique"
          },
          {
            "id": "LI-LA-LIBERTAD-COSTA-05",
            "name": "Teotepeque"
          }
        ]
      },
      {
        "id": "LI-LA-LIBERTAD-SUR",
        "name": "La Libertad Sur",
        "districts": [
          {
            "id": "LI-LA-LIBERTAD-SUR-01",
            "name": "Comasagua"
          },
          {
            "id": "LI-LA-LIBERTAD-SUR-02",
            "name": "Santa Tecla"
          }
        ]
      }
    ]
  },
  {
    "id": "CH",
    "name": "Chalatenango",
    "municipalities": [
      {
        "id": "CH-CHALATENANGO-NORTE",
        "name": "Chalatenango Norte",
        "districts": [
          {
            "id": "CH-CHALATENANGO-NORTE-01",
            "name": "La Palma"
          },
          {
            "id": "CH-CHALATENANGO-NORTE-02",
            "name": "Citalá"
          },
          {
            "id": "CH-CHALATENANGO-NORTE-03",
            "name": "San Ignacio"
          }
        ]
      },
      {
        "id": "CH-CHALATENANGO-CENTRO",
        "name": "Chalatenango Centro",
        "districts": [
          {
            "id": "CH-CHALATENANGO-CENTRO-01",
            "name": "Nueva Concepción"
          },
          {
            "id": "CH-CHALATENANGO-CENTRO-02",
            "name": "Tejutla"
          },
          {
            "id": "CH-CHALATENANGO-CENTRO-03",
            "name": "La Reina"
          },
          {
            "id": "CH-CHALATENANGO-CENTRO-04",
            "name": "Agua Caliente"
          },
          {
            "id": "CH-CHALATENANGO-CENTRO-05",
            "name": "Dulce Nombre de María"
          },
          {
            "id": "CH-CHALATENANGO-CENTRO-06",
            "name": "El Paraíso"
          },
          {
            "id": "CH-CHALATENANGO-CENTRO-07",
            "name": "San Fernando"
          },
          {
            "id": "CH-CHALATENANGO-CENTRO-08",
            "name": "San Francisco Morazán"
          },
          {
            "id": "CH-CHALATENANGO-CENTRO-09",
            "name": "San Rafael"
          },
          {
            "id": "CH-CHALATENANGO-CENTRO-10",
            "name": "Santa Rita"
          }
        ]
      },
      {
        "id": "CH-CHALATENANGO-SUR",
        "name": "Chalatenango Sur",
        "districts": [
          {
            "id": "CH-CHALATENANGO-SUR-01",
            "name": "Chalatenango"
          },
          {
            "id": "CH-CHALATENANGO-SUR-02",
            "name": "Arcatao"
          },
          {
            "id": "CH-CHALATENANGO-SUR-03",
            "name": "Azacualpa"
          },
          {
            "id": "CH-CHALATENANGO-SUR-04",
            "name": "Comalapa"
          },
          {
            "id": "CH-CHALATENANGO-SUR-05",
            "name": "Concepción Quezaltepeque"
          },
          {
            "id": "CH-CHALATENANGO-SUR-06",
            "name": "El Carrizal"
          },
          {
            "id": "CH-CHALATENANGO-SUR-07",
            "name": "La Laguna"
          },
          {
            "id": "CH-CHALATENANGO-SUR-08",
            "name": "Las Vueltas"
          },
          {
            "id": "CH-CHALATENANGO-SUR-09",
            "name": "Nombre de Jesús"
          },
          {
            "id": "CH-CHALATENANGO-SUR-10",
            "name": "Nueva Trinidad"
          },
          {
            "id": "CH-CHALATENANGO-SUR-11",
            "name": "Ojos de Agua"
          },
          {
            "id": "CH-CHALATENANGO-SUR-12",
            "name": "Potonico"
          },
          {
            "id": "CH-CHALATENANGO-SUR-13",
            "name": "San Antonio de La Cruz"
          },
          {
            "id": "CH-CHALATENANGO-SUR-14",
            "name": "San Antonio Los Ranchos"
          },
          {
            "id": "CH-CHALATENANGO-SUR-15",
            "name": "San Francisco Lempa"
          },
          {
            "id": "CH-CHALATENANGO-SUR-16",
            "name": "San Isidro Labrador"
          },
          {
            "id": "CH-CHALATENANGO-SUR-17",
            "name": "San José Cancasque"
          },
          {
            "id": "CH-CHALATENANGO-SUR-18",
            "name": "San Miguel de Mercedes"
          },
          {
            "id": "CH-CHALATENANGO-SUR-19",
            "name": "San José Las Flores"
          },
          {
            "id": "CH-CHALATENANGO-SUR-20",
            "name": "San Luis del Carmen"
          }
        ]
      }
    ]
  },
  {
    "id": "CU",
    "name": "Cuscatlán",
    "municipalities": [
      {
        "id": "CU-CUSCATLAN-NORTE",
        "name": "Cuscatlán Norte",
        "districts": [
          {
            "id": "CU-CUSCATLAN-NORTE-01",
            "name": "Suchitoto"
          },
          {
            "id": "CU-CUSCATLAN-NORTE-02",
            "name": "San José Guayabal"
          },
          {
            "id": "CU-CUSCATLAN-NORTE-03",
            "name": "Oratorio de Concepción"
          },
          {
            "id": "CU-CUSCATLAN-NORTE-04",
            "name": "San Bartolomé Perulapía"
          },
          {
            "id": "CU-CUSCATLAN-NORTE-05",
            "name": "San Pedro Perulapán"
          }
        ]
      },
      {
        "id": "CU-CUSCATLAN-SUR",
        "name": "Cuscatlán Sur",
        "districts": [
          {
            "id": "CU-CUSCATLAN-SUR-01",
            "name": "Cojutepeque"
          },
          {
            "id": "CU-CUSCATLAN-SUR-02",
            "name": "San Rafael Cedros"
          },
          {
            "id": "CU-CUSCATLAN-SUR-03",
            "name": "Candelaria"
          },
          {
            "id": "CU-CUSCATLAN-SUR-04",
            "name": "Monte San Juan"
          },
          {
            "id": "CU-CUSCATLAN-SUR-05",
            "name": "El Carmen"
          },
          {
            "id": "CU-CUSCATLAN-SUR-06",
            "name": "San Cristóbal"
          },
          {
            "id": "CU-CUSCATLAN-SUR-07",
            "name": "Santa Cruz Michapa"
          },
          {
            "id": "CU-CUSCATLAN-SUR-08",
            "name": "San Ramón"
          },
          {
            "id": "CU-CUSCATLAN-SUR-09",
            "name": "El Rosario"
          },
          {
            "id": "CU-CUSCATLAN-SUR-10",
            "name": "Santa Cruz Analquito"
          },
          {
            "id": "CU-CUSCATLAN-SUR-11",
            "name": "Tenancingo"
          }
        ]
      }
    ]
  },
  {
    "id": "CA",
    "name": "Cabañas",
    "municipalities": [
      {
        "id": "CA-CABANAS-ESTE",
        "name": "Cabañas Este",
        "districts": [
          {
            "id": "CA-CABANAS-ESTE-01",
            "name": "Sensuntepeque"
          },
          {
            "id": "CA-CABANAS-ESTE-02",
            "name": "Victoria"
          },
          {
            "id": "CA-CABANAS-ESTE-03",
            "name": "Dolores"
          },
          {
            "id": "CA-CABANAS-ESTE-04",
            "name": "Guacotecti"
          },
          {
            "id": "CA-CABANAS-ESTE-05",
            "name": "San Isidro"
          }
        ]
      },
      {
        "id": "CA-CABANAS-OESTE",
        "name": "Cabañas Oeste",
        "districts": [
          {
            "id": "CA-CABANAS-OESTE-01",
            "name": "Ilobasco"
          },
          {
            "id": "CA-CABANAS-OESTE-02",
            "name": "Tejutepeque"
          },
          {
            "id": "CA-CABANAS-OESTE-03",
            "name": "Jutiapa"
          },
          {
            "id": "CA-CABANAS-OESTE-04",
            "name": "Cinquera"
          }
        ]
      }
    ]
  },
  {
    "id": "PA",
    "name": "La Paz",
    "municipalities": [
      {
        "id": "PA-LA-PAZ-OESTE",
        "name": "La Paz Oeste",
        "districts": [
          {
            "id": "PA-LA-PAZ-OESTE-01",
            "name": "Cuyultitán"
          },
          {
            "id": "PA-LA-PAZ-OESTE-02",
            "name": "Olocuilta"
          },
          {
            "id": "PA-LA-PAZ-OESTE-03",
            "name": "San Juan Talpa"
          },
          {
            "id": "PA-LA-PAZ-OESTE-04",
            "name": "San Luis Talpa"
          },
          {
            "id": "PA-LA-PAZ-OESTE-05",
            "name": "San Pedro Masahuat"
          },
          {
            "id": "PA-LA-PAZ-OESTE-06",
            "name": "Tapalhuaca"
          },
          {
            "id": "PA-LA-PAZ-OESTE-07",
            "name": "San Francisco Chinameca"
          }
        ]
      },
      {
        "id": "PA-LA-PAZ-CENTRO",
        "name": "La Paz Centro",
        "districts": [
          {
            "id": "PA-LA-PAZ-CENTRO-01",
            "name": "El Rosario"
          },
          {
            "id": "PA-LA-PAZ-CENTRO-02",
            "name": "Jerusalén"
          },
          {
            "id": "PA-LA-PAZ-CENTRO-03",
            "name": "Mercedes La Ceiba"
          },
          {
            "id": "PA-LA-PAZ-CENTRO-04",
            "name": "Paraíso de Osorio"
          },
          {
            "id": "PA-LA-PAZ-CENTRO-05",
            "name": "San Antonio Masahuat"
          },
          {
            "id": "PA-LA-PAZ-CENTRO-06",
            "name": "San Emigdio"
          },
          {
            "id": "PA-LA-PAZ-CENTRO-07",
            "name": "San Juan Tepezontes"
          },
          {
            "id": "PA-LA-PAZ-CENTRO-08",
            "name": "San Luis La Herradura"
          },
          {
            "id": "PA-LA-PAZ-CENTRO-09",
            "name": "San Miguel Tepezontes"
          },
          {
            "id": "PA-LA-PAZ-CENTRO-10",
            "name": "San Pedro Nonualco"
          },
          {
            "id": "PA-LA-PAZ-CENTRO-11",
            "name": "Santa María Ostuma"
          },
          {
            "id": "PA-LA-PAZ-CENTRO-12",
            "name": "Santiago Nonualco"
          }
        ]
      },
      {
        "id": "PA-LA-PAZ-ESTE",
        "name": "La Paz Este",
        "districts": [
          {
            "id": "PA-LA-PAZ-ESTE-01",
            "name": "San Juan Nonualco"
          },
          {
            "id": "PA-LA-PAZ-ESTE-02",
            "name": "San Rafael Obrajuelo"
          },
          {
            "id": "PA-LA-PAZ-ESTE-03",
            "name": "Zacatecoluca"
          }
        ]
      }
    ]
  },
  {
    "id": "UN",
    "name": "La Unión",
    "municipalities": [
      {
        "id": "UN-LA-UNION-NORTE",
        "name": "La Unión Norte",
        "districts": [
          {
            "id": "UN-LA-UNION-NORTE-01",
            "name": "Anamorós"
          },
          {
            "id": "UN-LA-UNION-NORTE-02",
            "name": "Bolívar"
          },
          {
            "id": "UN-LA-UNION-NORTE-03",
            "name": "Concepción de Oriente"
          },
          {
            "id": "UN-LA-UNION-NORTE-04",
            "name": "El Sauce"
          },
          {
            "id": "UN-LA-UNION-NORTE-05",
            "name": "Lislique"
          },
          {
            "id": "UN-LA-UNION-NORTE-06",
            "name": "Nueva Esparta"
          },
          {
            "id": "UN-LA-UNION-NORTE-07",
            "name": "Pasaquina"
          },
          {
            "id": "UN-LA-UNION-NORTE-08",
            "name": "Polorós"
          },
          {
            "id": "UN-LA-UNION-NORTE-09",
            "name": "San José La Fuente"
          },
          {
            "id": "UN-LA-UNION-NORTE-10",
            "name": "Santa Rosa de Lima"
          }
        ]
      },
      {
        "id": "UN-LA-UNION-SUR",
        "name": "La Unión Sur",
        "districts": [
          {
            "id": "UN-LA-UNION-SUR-01",
            "name": "Conchagua"
          },
          {
            "id": "UN-LA-UNION-SUR-02",
            "name": "El Carmen"
          },
          {
            "id": "UN-LA-UNION-SUR-03",
            "name": "Intipucá"
          },
          {
            "id": "UN-LA-UNION-SUR-04",
            "name": "La Unión"
          },
          {
            "id": "UN-LA-UNION-SUR-05",
            "name": "Meanguera del Golfo"
          },
          {
            "id": "UN-LA-UNION-SUR-06",
            "name": "San Alejo"
          },
          {
            "id": "UN-LA-UNION-SUR-07",
            "name": "Yayantique"
          },
          {
            "id": "UN-LA-UNION-SUR-08",
            "name": "Yucuaiquín"
          }
        ]
      }
    ]
  },
  {
    "id": "US",
    "name": "Usulután",
    "municipalities": [
      {
        "id": "US-USULUTAN-NORTE",
        "name": "Usulután Norte",
        "districts": [
          {
            "id": "US-USULUTAN-NORTE-01",
            "name": "Santiago de María"
          },
          {
            "id": "US-USULUTAN-NORTE-02",
            "name": "Alegría"
          },
          {
            "id": "US-USULUTAN-NORTE-03",
            "name": "Berlín"
          },
          {
            "id": "US-USULUTAN-NORTE-04",
            "name": "Mercedes Umaña"
          },
          {
            "id": "US-USULUTAN-NORTE-05",
            "name": "Jucuapa"
          },
          {
            "id": "US-USULUTAN-NORTE-06",
            "name": "El Triunfo"
          },
          {
            "id": "US-USULUTAN-NORTE-07",
            "name": "Estanzuelas"
          },
          {
            "id": "US-USULUTAN-NORTE-08",
            "name": "San Buenaventura"
          },
          {
            "id": "US-USULUTAN-NORTE-09",
            "name": "Nueva Granada"
          }
        ]
      },
      {
        "id": "US-USULUTAN-ESTE",
        "name": "Usulután Este",
        "districts": [
          {
            "id": "US-USULUTAN-ESTE-01",
            "name": "Usulután"
          },
          {
            "id": "US-USULUTAN-ESTE-02",
            "name": "Jucuarán"
          },
          {
            "id": "US-USULUTAN-ESTE-03",
            "name": "San Dionisio"
          },
          {
            "id": "US-USULUTAN-ESTE-04",
            "name": "Concepción Batres"
          },
          {
            "id": "US-USULUTAN-ESTE-05",
            "name": "Santa María"
          },
          {
            "id": "US-USULUTAN-ESTE-06",
            "name": "Ozatlán"
          },
          {
            "id": "US-USULUTAN-ESTE-07",
            "name": "Tecapán"
          },
          {
            "id": "US-USULUTAN-ESTE-08",
            "name": "Santa Elena"
          },
          {
            "id": "US-USULUTAN-ESTE-09",
            "name": "California"
          },
          {
            "id": "US-USULUTAN-ESTE-10",
            "name": "Ereguayquín"
          }
        ]
      },
      {
        "id": "US-USULUTAN-OESTE",
        "name": "Usulután Oeste",
        "districts": [
          {
            "id": "US-USULUTAN-OESTE-01",
            "name": "Jiquilisco"
          },
          {
            "id": "US-USULUTAN-OESTE-02",
            "name": "Puerto El Triunfo"
          },
          {
            "id": "US-USULUTAN-OESTE-03",
            "name": "San Agustín"
          },
          {
            "id": "US-USULUTAN-OESTE-04",
            "name": "San Francisco Javier"
          }
        ]
      }
    ]
  },
  {
    "id": "SO",
    "name": "Sonsonate",
    "municipalities": [
      {
        "id": "SO-SONSONATE-NORTE",
        "name": "Sonsonate Norte",
        "districts": [
          {
            "id": "SO-SONSONATE-NORTE-01",
            "name": "Juayúa"
          },
          {
            "id": "SO-SONSONATE-NORTE-02",
            "name": "Nahuizalco"
          },
          {
            "id": "SO-SONSONATE-NORTE-03",
            "name": "Salcoatitán"
          },
          {
            "id": "SO-SONSONATE-NORTE-04",
            "name": "Santa Catarina Masahuat"
          }
        ]
      },
      {
        "id": "SO-SONSONATE-CENTRO",
        "name": "Sonsonate Centro",
        "districts": [
          {
            "id": "SO-SONSONATE-CENTRO-01",
            "name": "Sonsonate"
          },
          {
            "id": "SO-SONSONATE-CENTRO-02",
            "name": "Sonzacate"
          },
          {
            "id": "SO-SONSONATE-CENTRO-03",
            "name": "Nahulingo"
          },
          {
            "id": "SO-SONSONATE-CENTRO-04",
            "name": "San Antonio del Monte"
          },
          {
            "id": "SO-SONSONATE-CENTRO-05",
            "name": "Santo Domingo de Guzmán"
          }
        ]
      },
      {
        "id": "SO-SONSONATE-ESTE",
        "name": "Sonsonate Este",
        "districts": [
          {
            "id": "SO-SONSONATE-ESTE-01",
            "name": "Izalco"
          },
          {
            "id": "SO-SONSONATE-ESTE-02",
            "name": "Armenia"
          },
          {
            "id": "SO-SONSONATE-ESTE-03",
            "name": "Caluco"
          },
          {
            "id": "SO-SONSONATE-ESTE-04",
            "name": "San Julián"
          },
          {
            "id": "SO-SONSONATE-ESTE-05",
            "name": "Cuisnahuat"
          },
          {
            "id": "SO-SONSONATE-ESTE-06",
            "name": "Santa Isabel Ishuatán"
          }
        ]
      },
      {
        "id": "SO-SONSONATE-OESTE",
        "name": "Sonsonate Oeste",
        "districts": [
          {
            "id": "SO-SONSONATE-OESTE-01",
            "name": "Acajutla"
          }
        ]
      }
    ]
  },
  {
    "id": "SA",
    "name": "Santa Ana",
    "municipalities": [
      {
        "id": "SA-SANTA-ANA-NORTE",
        "name": "Santa Ana Norte",
        "districts": [
          {
            "id": "SA-SANTA-ANA-NORTE-01",
            "name": "Masahuat"
          },
          {
            "id": "SA-SANTA-ANA-NORTE-02",
            "name": "Metapán"
          },
          {
            "id": "SA-SANTA-ANA-NORTE-03",
            "name": "Santa Rosa Guachipilín"
          },
          {
            "id": "SA-SANTA-ANA-NORTE-04",
            "name": "Texistepeque"
          }
        ]
      },
      {
        "id": "SA-SANTA-ANA-CENTRO",
        "name": "Santa Ana Centro",
        "districts": [
          {
            "id": "SA-SANTA-ANA-CENTRO-01",
            "name": "Santa Ana"
          }
        ]
      },
      {
        "id": "SA-SANTA-ANA-ESTE",
        "name": "Santa Ana Este",
        "districts": [
          {
            "id": "SA-SANTA-ANA-ESTE-01",
            "name": "Coatepeque"
          },
          {
            "id": "SA-SANTA-ANA-ESTE-02",
            "name": "El Congo"
          }
        ]
      },
      {
        "id": "SA-SANTA-ANA-OESTE",
        "name": "Santa Ana Oeste",
        "districts": [
          {
            "id": "SA-SANTA-ANA-OESTE-01",
            "name": "Candelaria de la Frontera"
          },
          {
            "id": "SA-SANTA-ANA-OESTE-02",
            "name": "Chalchuapa"
          },
          {
            "id": "SA-SANTA-ANA-OESTE-03",
            "name": "El Porvenir"
          },
          {
            "id": "SA-SANTA-ANA-OESTE-04",
            "name": "San Antonio Pajonal"
          },
          {
            "id": "SA-SANTA-ANA-OESTE-05",
            "name": "San Sebastián Salitrillo"
          },
          {
            "id": "SA-SANTA-ANA-OESTE-06",
            "name": "Santiago de La Frontera"
          }
        ]
      }
    ]
  },
  {
    "id": "SV",
    "name": "San Vicente",
    "municipalities": [
      {
        "id": "SV-SAN-VICENTE-NORTE",
        "name": "San Vicente Norte",
        "districts": [
          {
            "id": "SV-SAN-VICENTE-NORTE-01",
            "name": "Apastepeque"
          },
          {
            "id": "SV-SAN-VICENTE-NORTE-02",
            "name": "Santa Clara"
          },
          {
            "id": "SV-SAN-VICENTE-NORTE-03",
            "name": "San Ildefonso"
          },
          {
            "id": "SV-SAN-VICENTE-NORTE-04",
            "name": "San Esteban Catarina"
          },
          {
            "id": "SV-SAN-VICENTE-NORTE-05",
            "name": "San Sebastián"
          },
          {
            "id": "SV-SAN-VICENTE-NORTE-06",
            "name": "San Lorenzo"
          },
          {
            "id": "SV-SAN-VICENTE-NORTE-07",
            "name": "Santo Domingo"
          }
        ]
      },
      {
        "id": "SV-SAN-VICENTE-SUR",
        "name": "San Vicente Sur",
        "districts": [
          {
            "id": "SV-SAN-VICENTE-SUR-01",
            "name": "San Vicente"
          },
          {
            "id": "SV-SAN-VICENTE-SUR-02",
            "name": "Guadalupe"
          },
          {
            "id": "SV-SAN-VICENTE-SUR-03",
            "name": "Verapaz"
          },
          {
            "id": "SV-SAN-VICENTE-SUR-04",
            "name": "Tepetitán"
          },
          {
            "id": "SV-SAN-VICENTE-SUR-05",
            "name": "Tecoluca"
          },
          {
            "id": "SV-SAN-VICENTE-SUR-06",
            "name": "San Cayetano Istepeque"
          }
        ]
      }
    ]
  },
  {
    "id": "SM",
    "name": "San Miguel",
    "municipalities": [
      {
        "id": "SM-SAN-MIGUEL-NORTE",
        "name": "San Miguel Norte",
        "districts": [
          {
            "id": "SM-SAN-MIGUEL-NORTE-01",
            "name": "Ciudad Barrios"
          },
          {
            "id": "SM-SAN-MIGUEL-NORTE-02",
            "name": "Sesori"
          },
          {
            "id": "SM-SAN-MIGUEL-NORTE-03",
            "name": "Nuevo Edén de San Juan"
          },
          {
            "id": "SM-SAN-MIGUEL-NORTE-04",
            "name": "San Gerardo"
          },
          {
            "id": "SM-SAN-MIGUEL-NORTE-05",
            "name": "San Luis de La Reina"
          },
          {
            "id": "SM-SAN-MIGUEL-NORTE-06",
            "name": "Carolina"
          },
          {
            "id": "SM-SAN-MIGUEL-NORTE-07",
            "name": "San Antonio del Mosco"
          },
          {
            "id": "SM-SAN-MIGUEL-NORTE-08",
            "name": "Chapeltique"
          }
        ]
      },
      {
        "id": "SM-SAN-MIGUEL-CENTRO",
        "name": "San Miguel Centro",
        "districts": [
          {
            "id": "SM-SAN-MIGUEL-CENTRO-01",
            "name": "San Miguel"
          },
          {
            "id": "SM-SAN-MIGUEL-CENTRO-02",
            "name": "Comacarán"
          },
          {
            "id": "SM-SAN-MIGUEL-CENTRO-03",
            "name": "Uluazapa"
          },
          {
            "id": "SM-SAN-MIGUEL-CENTRO-04",
            "name": "Moncagua"
          },
          {
            "id": "SM-SAN-MIGUEL-CENTRO-05",
            "name": "Quelepa"
          },
          {
            "id": "SM-SAN-MIGUEL-CENTRO-06",
            "name": "Chirilagua"
          }
        ]
      },
      {
        "id": "SM-SAN-MIGUEL-OESTE",
        "name": "San Miguel Oeste",
        "districts": [
          {
            "id": "SM-SAN-MIGUEL-OESTE-01",
            "name": "Chinameca"
          },
          {
            "id": "SM-SAN-MIGUEL-OESTE-02",
            "name": "Nueva Guadalupe"
          },
          {
            "id": "SM-SAN-MIGUEL-OESTE-03",
            "name": "Lolotique"
          },
          {
            "id": "SM-SAN-MIGUEL-OESTE-04",
            "name": "San Jorge"
          },
          {
            "id": "SM-SAN-MIGUEL-OESTE-05",
            "name": "San Rafael Oriente"
          },
          {
            "id": "SM-SAN-MIGUEL-OESTE-06",
            "name": "El Tránsito"
          }
        ]
      }
    ]
  },
  {
    "id": "MO",
    "name": "Morazán",
    "municipalities": [
      {
        "id": "MO-MORAZAN-NORTE",
        "name": "Morazán Norte",
        "districts": [
          {
            "id": "MO-MORAZAN-NORTE-01",
            "name": "Arambala"
          },
          {
            "id": "MO-MORAZAN-NORTE-02",
            "name": "Cacaopera"
          },
          {
            "id": "MO-MORAZAN-NORTE-03",
            "name": "Corinto"
          },
          {
            "id": "MO-MORAZAN-NORTE-04",
            "name": "El Rosario"
          },
          {
            "id": "MO-MORAZAN-NORTE-05",
            "name": "Joateca"
          },
          {
            "id": "MO-MORAZAN-NORTE-06",
            "name": "Jocoaitique"
          },
          {
            "id": "MO-MORAZAN-NORTE-07",
            "name": "Meanguera"
          },
          {
            "id": "MO-MORAZAN-NORTE-08",
            "name": "Perquín"
          },
          {
            "id": "MO-MORAZAN-NORTE-09",
            "name": "San Fernando"
          },
          {
            "id": "MO-MORAZAN-NORTE-10",
            "name": "San Isidro"
          },
          {
            "id": "MO-MORAZAN-NORTE-11",
            "name": "Torola"
          }
        ]
      },
      {
        "id": "MO-MORAZAN-SUR",
        "name": "Morazán Sur",
        "districts": [
          {
            "id": "MO-MORAZAN-SUR-01",
            "name": "Chilanga"
          },
          {
            "id": "MO-MORAZAN-SUR-02",
            "name": "Delicias de Concepción"
          },
          {
            "id": "MO-MORAZAN-SUR-03",
            "name": "El Divisadero"
          },
          {
            "id": "MO-MORAZAN-SUR-04",
            "name": "Gualococti"
          },
          {
            "id": "MO-MORAZAN-SUR-05",
            "name": "Guatajiagua"
          },
          {
            "id": "MO-MORAZAN-SUR-06",
            "name": "Jocoro"
          },
          {
            "id": "MO-MORAZAN-SUR-07",
            "name": "Lolotiquillo"
          },
          {
            "id": "MO-MORAZAN-SUR-08",
            "name": "Osicala"
          },
          {
            "id": "MO-MORAZAN-SUR-09",
            "name": "San Carlos"
          },
          {
            "id": "MO-MORAZAN-SUR-10",
            "name": "San Francisco Gotera"
          },
          {
            "id": "MO-MORAZAN-SUR-11",
            "name": "San Simón"
          },
          {
            "id": "MO-MORAZAN-SUR-12",
            "name": "Sensembra"
          },
          {
            "id": "MO-MORAZAN-SUR-13",
            "name": "Sociedad"
          },
          {
            "id": "MO-MORAZAN-SUR-14",
            "name": "Yamabal"
          },
          {
            "id": "MO-MORAZAN-SUR-15",
            "name": "Yoloaiquín"
          }
        ]
      }
    ]
  }
];

export const EL_SALVADOR_COUNTRY_ISO = 'SV';
export const EL_SALVADOR_COUNTRY_LABEL = 'El Salvador';

function normalizeGeoLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function matchDepartmentName(value: string | null | undefined): string {
  const raw = (value || '').trim();
  if (!raw) return '';
  const needle = normalizeGeoLabel(raw);
  const found = EL_SALVADOR_GEO.find(
    (d) => normalizeGeoLabel(d.name) === needle || normalizeGeoLabel(d.id) === needle
  );
  return found?.name ?? '';
}

export function matchMunicipalityName(
  departmentName: string | null | undefined,
  municipality: string | null | undefined
): string {
  const dept = matchDepartmentName(departmentName);
  const raw = (municipality || '').trim();
  if (!dept || !raw) return '';
  const list = EL_SALVADOR_GEO.find((d) => d.name === dept)?.municipalities ?? [];
  const needle = normalizeGeoLabel(raw);
  return list.find((m) => normalizeGeoLabel(m.name) === needle)?.name ?? '';
}

export function matchDistrictName(
  departmentName: string | null | undefined,
  municipalityName: string | null | undefined,
  district: string | null | undefined
): string {
  const muni = matchMunicipalityName(departmentName, municipalityName);
  const raw = (district || '').trim();
  if (!muni || !raw) return '';
  const dept = matchDepartmentName(departmentName);
  const muniObj = EL_SALVADOR_GEO.find((d) => d.name === dept)?.municipalities.find(
    (m) => m.name === muni
  );
  const needle = normalizeGeoLabel(raw);
  return muniObj?.districts.find((x) => normalizeGeoLabel(x.name) === needle)?.name ?? '';
}

export function municipalitiesForDepartment(departmentName: string): MunicipalityGeo[] {
  const dept = matchDepartmentName(departmentName);
  if (!dept) return [];
  return EL_SALVADOR_GEO.find((d) => d.name === dept)?.municipalities ?? [];
}

export function districtsForMunicipality(
  departmentName: string,
  municipalityName: string
): DistrictGeo[] {
  const muni = matchMunicipalityName(departmentName, municipalityName);
  if (!muni) return [];
  const dept = matchDepartmentName(departmentName);
  return (
    EL_SALVADOR_GEO.find((d) => d.name === dept)?.municipalities.find((m) => m.name === muni)
      ?.districts ?? []
  );
}

/**
 * Resuelve municipio+distrito desde valores guardados (p. ej. ciudad antigua = distrito).
 */
export function resolveMunicipalityAndDistrict(
  departmentName: string | null | undefined,
  municipalityOrCity: string | null | undefined,
  districtHint: string | null | undefined = null
): { municipality: string; district: string } {
  const dept = matchDepartmentName(departmentName);
  if (!dept) return { municipality: '', district: '' };

  const muniDirect = matchMunicipalityName(dept, municipalityOrCity);
  if (muniDirect) {
    const dist = matchDistrictName(dept, muniDirect, districtHint);
    return { municipality: muniDirect, district: dist };
  }

  const needleCity = normalizeGeoLabel(municipalityOrCity || '');
  const needleDist = normalizeGeoLabel(districtHint || '');
  const munis = EL_SALVADOR_GEO.find((d) => d.name === dept)?.municipalities ?? [];

  for (const m of munis) {
    const hit =
      m.districts.find((x) => normalizeGeoLabel(x.name) === needleDist) ||
      m.districts.find((x) => normalizeGeoLabel(x.name) === needleCity);
    if (hit) {
      return { municipality: m.name, district: hit.name };
    }
  }

  return { municipality: '', district: '' };
}
