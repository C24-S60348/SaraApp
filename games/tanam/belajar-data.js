// Learning path for Tanam Tanam: each chapter has 4 tahap. A tahap = a short lesson + a 5-question mini quiz.
// `qs` are positions (0-19) in that chapter's question bank in kuiz-data.js, so the quiz always matches the lesson.
// `art` is which growth picture to show (0 seed, 1 sprout, 2 growing, 3 harvest).
const PLANT_TAHAP = ["Kenali", "Menyemai", "Menjaga", "Menuai"];
const BELAJAR = [
  { bank: "asas", name: "Asas Menanam", plant: "bayam", intro: "Mula di sini! Belajar perkara asas tentang tumbuhan.", tahap: [
    { title: "Bahagian Tumbuhan", art: 2, qs: [1, 8, 9, 3, 11], facts: [
      "Akar menyerap air dari tanah.",
      "Batang membawa air dari akar ke daun.",
      "Daun ialah \"dapur\" tumbuhan, tempat makanan dibuat.",
      "Biji benih boleh bercambah dan menjadi pokok baru."] },
    { title: "Keperluan Tumbuhan", art: 3, qs: [0, 2, 5, 12, 17], facts: [
      "Tumbuhan perlukan cahaya matahari untuk membuat makanan. Proses ini dipanggil fotosintesis.",
      "Daun mengambil gas karbon dioksida dari udara.",
      "Pada waktu siang, tumbuhan mengeluarkan oksigen yang kita sedut.",
      "Tanpa cukup cahaya, pokok tumbuh lemah dan pucat."] },
    { title: "Tanah, Air dan Baja", art: 1, qs: [4, 6, 7, 13, 15], facts: [
      "Siram pokok pada waktu pagi atau petang, bukan tengah hari yang terik.",
      "Terlalu banyak air boleh membuatkan akar reput. Lubang di bawah pasu membantu air berlebihan keluar.",
      "Tanah yang gembur lembut dan mudah digali.",
      "Baja kompos dibuat daripada sisa dapur dan daun reput."] },
    { title: "Kawan dan Penjagaan", art: 3, qs: [10, 14, 16, 18, 19], facts: [
      "Lebah membawa debunga dari bunga ke bunga.",
      "Cacing tanah menggemburkan tanah.",
      "Cabut rumput liar kerana ia berebut air dan baja dengan pokok.",
      "Buang batu sebelum menanam, dan jarangkan anak pokok supaya tidak bersesak."] }
  ]},
  { bank: "tomato", name: "Tomato", plant: "tomato", intro: "Buah merah yang manis dan segar.", tahap: [
    { art: 3, qs: [1, 12, 13, 14, 19], facts: [
      "Tomato ialah buah yang tumbuh pada dahan, di atas tanah. Kita makan buahnya.",
      "Pokok tomato berbunga kuning dahulu, kemudian barulah buahnya terbentuk.",
      "Anak pokok tomato mula tumbuh dengan dua helai daun."] },
    { art: 0, qs: [5, 6, 7, 11, 16], facts: [
      "Biji tomato kecil, leper dan berwarna kuning cair.",
      "Rendam biji dalam air suam selama sehari, kemudian tabur 2 hingga 3 biji dalam pasu kecil.",
      "Guna tanah subur yang gembur.",
      "Biji bercambah selepas 5 hingga 10 hari."] },
    { art: 2, qs: [0, 8, 9, 10, 15], facts: [
      "Tomato perlu 6 hingga 8 jam cahaya matahari. Letakkan pasunya di tempat yang cerah.",
      "Siram pada waktu pagi.",
      "Bila tingginya kira-kira 15 cm, pindahkan ke pasu besar.",
      "Pasang kayu penyokong supaya batangnya tidak rebah."] },
    { art: 3, qs: [2, 3, 4, 17, 18], facts: [
      "Tomato boleh dituai selepas 60 hingga 80 hari.",
      "Apabila masak, warna buahnya bertukar dari hijau ke merah.",
      "Petik bila buahnya sudah merah sepenuhnya.",
      "Tomato boleh dijadikan sos tomato."] }
  ]},
  { bank: "cili", name: "Cili", plant: "cili", intro: "Pedas dan sesuai untuk masakan harian.", tahap: [
    { art: 3, qs: [6, 9, 12, 13, 18], facts: [
      "Cili rasanya pedas. Kita makan buahnya.",
      "Pokok cili ialah pokok kecil yang bercabang, dan bunganya berwarna putih.",
      "Cili suka tempat yang cerah dan panas."] },
    { art: 0, qs: [3, 4, 5, 16, 17], facts: [
      "Ambil biji dari buah cili yang masak, kemudian keringkan sehari.",
      "Biji cili bulat, leper dan berwarna krim.",
      "Semai dalam bekas kecil dan tutup dengan lapisan tanah yang nipis."] },
    { art: 2, qs: [0, 1, 7, 10, 11], facts: [
      "Tunas muncul selepas 7 hingga 14 hari.",
      "Pastikan tanah lembap tetapi tidak banjir. Siram sehari sekali.",
      "Cili perlu kira-kira 6 jam cahaya matahari.",
      "Pindahkan ke pasu bila ada 4 hingga 6 helai daun."] },
    { art: 3, qs: [2, 8, 14, 15, 19], facts: [
      "Buah cili tumbuh pada dahan, di atas tanah.",
      "Cili muda berwarna hijau, kemudian menjadi merah menyala apabila masak.",
      "Cili boleh dituai selepas 70 hingga 90 hari, dan selalu dijadikan sambal."] }
  ]},
  { bank: "bunga", name: "Bunga Matahari", plant: "bunga", intro: "Bunga kuning besar yang menghadap matahari.", tahap: [
    { art: 3, qs: [7, 8, 13, 15, 17], facts: [
      "Bunga matahari menghadap matahari, sebab itulah namanya begitu.",
      "Kelopaknya kuning dan bahagian tengahnya coklat gelap.",
      "Batangnya tegak dan tebal. Pokoknya boleh tumbuh lebih tinggi daripada seorang kanak-kanak."] },
    { art: 0, qs: [3, 4, 5, 6, 12], facts: [
      "Biji bunga matahari bergaris hitam dan putih, berbentuk seperti titisan air.",
      "Tanam biji sedalam kira-kira 2 cm, dengan jarak kira-kira 30 cm.",
      "Dalam seminggu, dua daun bulat yang kecil akan muncul."] },
    { art: 2, qs: [0, 1, 9, 10, 16], facts: [
      "Bunga matahari tumbuh di atas tanah dan perlukan kira-kira 8 jam cahaya matahari.",
      "Pilih tempat yang paling panas dan cerah.",
      "Siram dua hari sekali.",
      "Sokong batang yang tinggi dengan kayu."] },
    { art: 3, qs: [2, 11, 14, 18, 19], facts: [
      "Bunga mekar selepas 70 hingga 100 hari.",
      "Lebah dan burung suka bunga matahari kerana debunga dan bijinya.",
      "Biarkan bunga kering untuk mendapat bijinya. Biji boleh dimakan sebagai kuaci dan dijadikan minyak masak."] }
  ]},
  { bank: "kangkung", name: "Kangkung", plant: "kangkung", intro: "Sayur yang cepat tumbuh, boleh dituai dalam sebulan.", tahap: [
    { art: 3, qs: [10, 11, 12, 16, 18], facts: [
      "Kangkung ialah sayur berdaun hijau. Kita makan daun dan batang mudanya.",
      "Batangnya berongga, kosong di tengah, dan daunnya tajam seperti mata anak panah.",
      "Kangkung antara sayur yang paling cepat boleh dituai."] },
    { art: 0, qs: [4, 5, 7, 8, 19], facts: [
      "Biji kangkung kecil dan berwarna coklat tua. Rendam semalaman sebelum ditanam.",
      "Tabur rapat-rapat dalam bekas berisi tanah lembap.",
      "Tunas muncul selepas 3 hingga 5 hari. Kangkung tumbuh di atas tanah."] },
    { art: 2, qs: [1, 2, 9, 14, 17], facts: [
      "Kangkung suka banyak air. Siram dua kali sehari, pagi dan petang.",
      "Ia juga boleh tumbuh di kawasan berair seperti tepi kolam.",
      "Kangkung perlu 4 hingga 6 jam cahaya matahari.",
      "Kangkung cepat tumbuh semula selepas dipotong jika pangkalnya ditinggalkan."] },
    { art: 3, qs: [0, 3, 6, 13, 15], facts: [
      "Kangkung boleh dituai selepas 25 hingga 30 hari, bila tingginya 20 hingga 25 cm.",
      "Tinggalkan pangkalnya semasa memotong supaya ia tumbuh semula.",
      "Cuci bersih sebelum dimasak, contohnya kangkung goreng belacan."] }
  ]},
  { bank: "bayam", name: "Bayam", plant: "bayam", intro: "Sayur hijau berkhasiat yang cepat tumbuh.", tahap: [
    { art: 3, qs: [11, 12, 14, 18, 19], facts: [
      "Bayam ialah sayur berdaun yang tumbuh di atas tanah. Kita makan daun dan batang mudanya.",
      "Pokok bayam membentuk rumpun daun yang rendah.",
      "Bayam merah mempunyai batang yang kemerahan."] },
    { art: 0, qs: [1, 2, 5, 6, 7], facts: [
      "Biji bayam sangat kecil dan berwarna hitam.",
      "Tabur nipis-nipis dalam alur yang cetek, kemudian tutup dengan tanah halus kira-kira 1 cm.",
      "Tunas muncul selepas 4 hingga 7 hari."] },
    { art: 2, qs: [3, 4, 8, 13, 17], facts: [
      "Bayam perlu 4 hingga 6 jam cahaya matahari.",
      "Siram dengan lembut sehari sekali supaya tanah sentiasa lembap.",
      "Jarangkan anak pokok supaya tidak bersesak."] },
    { art: 3, qs: [0, 9, 10, 15, 16], facts: [
      "Bayam boleh dituai selepas 25 hingga 35 hari.",
      "Petik daun di bahagian luar dahulu. Daun di dalam akan terus tumbuh.",
      "Bayam kaya dengan zat besi dan sedap dimasak air."] }
  ]},
  { bank: "lobak", name: "Lobak Merah", plant: "lobak", intro: "Akar oren yang manis dan rangup, tumbuh di dalam tanah.", tahap: [
    { art: 3, qs: [0, 1, 2, 11, 19], facts: [
      "Lobak merah ialah sayur akar. Bahagian oren yang kita makan ialah akarnya.",
      "Ia membesar di dalam tanah. Di atas tanah, kita hanya nampak daunnya yang halus seperti bulu pelepah."] },
    { art: 0, qs: [3, 4, 5, 10, 18], facts: [
      "Gemburkan tanah sedalam kira-kira 30 cm dan buang batu supaya akarnya tumbuh lurus.",
      "Biji lobak merah sangat kecil dan berwarna coklat muda.",
      "Tutup biji dengan tanah setebal kira-kira 0.5 cm."] },
    { art: 1, qs: [6, 12, 13, 14, 16], facts: [
      "Tunas muncul selepas 1 hingga 2 minggu. Akar mudanya berwarna putih.",
      "Siram sehari sekali, dan beri kira-kira 6 jam cahaya matahari.",
      "Jarangkan anak pokok kira-kira 5 cm antara satu sama lain."] },
    { art: 3, qs: [7, 8, 9, 15, 17], facts: [
      "Lobak merah tersembunyi di dalam tanah semasa ia membesar.",
      "Ia boleh dituai selepas 70 hingga 80 hari, bila bahagian atasnya nampak kira-kira 2 cm lebar.",
      "Cabut perlahan-lahan. Lobak merah selalu dikatakan baik untuk mata."] }
  ]},
  { bank: "ubi", name: "Ubi Keledek", plant: "ubi", intro: "Ubi manis yang membesar di bawah tanah.", tahap: [
    { art: 3, qs: [5, 6, 11, 12, 18], facts: [
      "Ubi keledek ialah tanaman berubi. Ubinya terbentuk di bawah tanah.",
      "Pokoknya menjalar di atas tanah.",
      "Ubinya manis dan ada pelbagai warna: ungu, oren dan putih."] },
    { art: 0, qs: [3, 4, 9, 17, 19], facts: [
      "Ubi keledek ditanam daripada pucuk atau keratan batang, dengan 2 hingga 3 ruas di bawah tanah.",
      "Guna tanah yang gembur dan tidak berair supaya ubi mudah membesar.",
      "Selepas ditanam, pucuk kecil dan akar halus mula muncul."] },
    { art: 2, qs: [1, 2, 10, 13, 15], facts: [
      "Ubi keledek perlu 6 hingga 8 jam cahaya matahari.",
      "Siram dua hari sekali. Jangan terlalu kerap, nanti ubinya reput.",
      "Pucuk mudanya boleh dimasak sebagai sayur."] },
    { art: 3, qs: [0, 7, 8, 14, 16], facts: [
      "Ubi keledek boleh dituai selepas 90 hingga 120 hari.",
      "Gali dengan garpu tanah, berhati-hati supaya ubi tidak luka.",
      "Ubinya boleh direbus atau digoreng."] }
  ]}
];
// plant chapters use the standard tahap names
BELAJAR.forEach(ch => ch.tahap.forEach((t, i) => { if (!t.title) t.title = PLANT_TAHAP[i]; }));
