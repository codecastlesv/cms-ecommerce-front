// lib/data.ts

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  colors_count: number;
  is_new: boolean;
  images: string[];
}
/**SE CREA ESTE ARREGLO PARA SIMULAR DATOS PARA CUANDO SE CONSUMA LA DATA ESTAR LISTOS */
export const productsData: Product[] = [
  {
    id: "zapatilla-running-01",
    name: "Nike Zoom Pegasus",
    brand: "NIKE",
    description: "Calzado de running para asfalto",
    price: 135,
    colors_count: 8,
    is_new: true,
    images: [
      "https://sv.tiendasadoc.com/cdn/shop/files/30059250-1_1080x.jpg?v=1751453300",
      "https://paylesssv.vtexassets.com/arquivos/ids/464505-800-800?v=638642768658400000",
      "https://img.kwcdn.com/product/fancy/8e38f376-ea28-454d-b499-17d002d212a7.jpg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp",
      "https://sv.tiendasadoc.com/cdn/shop/files/30059250-1_1080x.jpg?v=1751453300",
      "https://paylesssv.vtexassets.com/arquivos/ids/464505-800-800?v=638642768658400000",
      "https://img.kwcdn.com/product/fancy/8e38f376-ea28-454d-b499-17d002d212a7.jpg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp",
    ] 
  },
  {
    id: "zapato-casual-02",
    name: "Classic Leather Urban",
    brand: "ADDO",
    description: "Estilo casual para el día a día",
    price: 85,
    colors_count: 3,
    is_new: false,
    images: [
      "https://sv.tiendasadoc.com/cdn/shop/files/30059250-1_1080x.jpg?v=1751453300",
      "https://paylesssv.vtexassets.com/arquivos/ids/464505-800-800?v=638642768658400000"
    ] 
  },
  {
    id: "deportivo-pro-03",
    name: "Air Max Sport Plus",
    brand: "NIKE",
    description: "Máxima amortiguación y confort",
    price: 160,
    colors_count: 12,
    is_new: true,
    images: [
  
      "https://img.kwcdn.com/product/fancy/8e38f376-ea28-454d-b499-17d002d212a7.jpg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp",
    ] 
  },
  {
    id: "vortex-tech-04",
    name: "Vortex Tech Runner",
    brand: "GALAXIA",
    description: "Tecnología de alto impacto",
    price: 110,
    colors_count: 5,
    is_new: true,
    images: [
      "https://paylesssv.vtexassets.com/arquivos/ids/464505-800-800?v=638642768658400000",
      "https://sv.tiendasadoc.com/cdn/shop/files/30059250-1_1080x.jpg?v=1751453300",
      "https://img.kwcdn.com/product/fancy/8e38f376-ea28-454d-b499-17d002d212a7.jpg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp"
    ] 
  },
  {
    id: "vortex-tech-05",
    name: "Vortex Tech Runner",
    brand: "GALAXIA",
    description: "Tecnología de alto impacto",
    price: 110,
    colors_count: 5,
    is_new: true,
    images: [
      "https://sv.tiendasadoc.com/cdn/shop/files/30059250-1_1080x.jpg?v=1751453300",
      "https://paylesssv.vtexassets.com/arquivos/ids/464505-800-800?v=638642768658400000",

      
      "https://img.kwcdn.com/product/fancy/8e38f376-ea28-454d-b499-17d002d212a7.jpg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp"
    ] 
  },
  {
    id: "vortex-tech-06",
    name: "Vortex Tech Runner",
    brand: "GALAXIA",
    description: "Tecnología de alto impacto",
    price: 110,
    colors_count: 5,
    is_new: true,
    images: [
      "https://sv.tiendasadoc.com/cdn/shop/files/30059250-1_1080x.jpg?v=1751453300",
      "https://paylesssv.vtexassets.com/arquivos/ids/464505-800-800?v=638642768658400000",
      "https://img.kwcdn.com/product/fancy/8e38f376-ea28-454d-b499-17d002d212a7.jpg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp"
    ] 
  },
  {
    id: "vortex-tech-07",
    name: "Vortex Tech Runner",
    brand: "GALAXIA",
    description: "Tecnología de alto impacto",
    price: 110,
    colors_count: 5,
    is_new: true,
    images: [
      "https://paylesssv.vtexassets.com/arquivos/ids/464505-800-800?v=638642768658400000",
       "https://img.kwcdn.com/product/fancy/8e38f376-ea28-454d-b499-17d002d212a7.jpg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp",
      "https://sv.tiendasadoc.com/cdn/shop/files/30059250-1_1080x.jpg?v=1751453300",
    
     
    ] 
  }
  ,
  {
    id: "vortex-tech-08",
    name: "Vortex Tech Runner",
    brand: "GALAXIA",
    description: "Tecnología de alto impacto",
    price: 110,
    colors_count: 5,
    is_new: true,
    images: [
    
      "https://sv.tiendasadoc.com/cdn/shop/files/30059250-1_1080x.jpg?v=1751453300",
        "https://paylesssv.vtexassets.com/arquivos/ids/464505-800-800?v=638642768658400000",
      
      "https://img.kwcdn.com/product/fancy/8e38f376-ea28-454d-b499-17d002d212a7.jpg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp"
    ] 
  }
];