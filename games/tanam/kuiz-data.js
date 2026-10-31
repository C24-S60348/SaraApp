// Question bank for Kuiz Tanam: 5 levels x 8 questions. The first option is always the correct one
// (the game shuffles the options before showing them).
const KUIZ_LEVELS = [
  {
    name: "Asas Menanam", plant: "bayam",
    qs: [
      ["Apakah yang diperlukan oleh tumbuhan untuk membuat makanan sendiri?", "Cahaya matahari", "Gula", "Garam", "Kegelapan"],
      ["Bahagian tumbuhan yang menyerap air dari tanah ialah…", "Akar", "Daun", "Bunga", "Buah"],
      ["Proses tumbuhan membuat makanan dipanggil…", "Fotosintesis", "Pencernaan", "Penyejatan", "Pendebungaan"],
      ["Benda yang boleh tumbuh menjadi pokok baru ialah…", "Biji benih", "Batu", "Pasir", "Daun kering"],
      ["Bilakah waktu yang baik untuk menyiram pokok?", "Pagi atau petang", "Tengah hari yang sangat panas", "Hanya bila hujan", "Tidak perlu disiram"],
      ["Gas apakah yang diambil oleh daun dari udara untuk membuat makanan?", "Karbon dioksida", "Oksigen", "Nitrogen", "Helium"],
      ["Apa yang boleh berlaku jika pokok disiram terlalu banyak?", "Akarnya boleh reput", "Pokok terus berbuah", "Daunnya jadi biru", "Tiada apa-apa"],
      ["Baja kompos dibuat daripada…", "Sisa dapur dan daun reput", "Plastik", "Kaca", "Besi"]
    ]
  },
  {
    name: "Tomato dan Cili", plant: "tomato",
    qs: [
      ["Berapa jam cahaya matahari diperlukan oleh tomato setiap hari?", "6 hingga 8 jam", "1 jam", "15 minit", "Tidak perlu cahaya"],
      ["Apakah warna bunga pokok tomato?", "Kuning", "Biru", "Hitam", "Ungu"],
      ["Bilakah tomato sedia untuk dipetik?", "Bila buahnya sudah merah", "Bila buahnya masih kecil dan hijau", "Bila daunnya gugur", "Pada hari pertama"],
      ["Mengapakah pokok tomato yang tinggi perlu kayu penyokong?", "Supaya batangnya tidak rebah", "Supaya buahnya cepat merah", "Untuk menghalau burung", "Supaya tidak perlu disiram"],
      ["Berapa lama masa untuk menuai tomato?", "60 hingga 80 hari", "2 hari", "5 tahun", "10 minit"],
      ["Biji cili untuk ditanam boleh diambil daripada…", "Buah cili yang masak", "Daun cili", "Akar cili", "Bunga tomato"],
      ["Apakah warna bunga pokok cili?", "Putih", "Merah", "Hitam", "Biru"],
      ["Bilakah anak pokok cili sesuai dipindahkan ke pasu?", "Bila ada 4 hingga 6 helai daun", "Sebelum bijinya ditanam", "Bila buahnya merah", "Selepas dituai"]
    ]
  },
  {
    name: "Sayur Daun", plant: "kangkung",
    qs: [
      ["Selepas berapa lama kangkung boleh dituai?", "25 hingga 30 hari", "1 tahun", "3 hari", "6 bulan"],
      ["Kangkung ialah sayur yang suka…", "Banyak air", "Tanah yang sangat kering", "Tempat gelap tanpa cahaya", "Air laut"],
      ["Berapa kali kangkung perlu disiram?", "Dua kali sehari", "Sebulan sekali", "Setahun sekali", "Tidak pernah"],
      ["Semasa memotong kangkung, kita tinggalkan pangkalnya supaya…", "Ia tumbuh semula", "Ia menjadi bunga", "Ia menjadi ubi", "Ia cepat mati"],
      ["Apakah warna biji bayam?", "Hitam", "Merah jambu", "Putih", "Biru"],
      ["Mengapakah anak pokok bayam perlu dijarangkan?", "Supaya tidak bersesak", "Supaya cepat layu", "Supaya tidak perlu cahaya", "Supaya daunnya gugur"],
      ["Semasa menuai bayam, daun manakah dipetik dahulu?", "Daun di bahagian luar", "Daun paling dalam", "Akarnya", "Semua sekali gus"],
      ["Selepas berapa lama bayam boleh dituai?", "25 hingga 35 hari", "2 tahun", "1 hari", "200 hari"]
    ]
  },
  {
    name: "Di Dalam Tanah", plant: "lobak",
    qs: [
      ["Bahagian lobak merah yang kita makan ialah…", "Akarnya", "Bunganya", "Buahnya", "Bijinya"],
      ["Berapa dalam tanah perlu digemburkan untuk menanam lobak merah?", "Kira-kira 30 cm", "1 cm", "3 meter", "Tidak perlu digemburkan"],
      ["Mengapakah batu perlu dibuang dari tanah lobak merah?", "Supaya akarnya tumbuh lurus", "Supaya cepat berbunga", "Supaya warnanya jadi biru", "Supaya tidak perlu disiram"],
      ["Bilakah lobak merah sedia dituai?", "Bila bahagian atasnya nampak kira-kira 2 cm lebar", "Sehari selepas ditanam", "Bila daunnya jadi hitam", "Bila pokoknya berbunga kuning besar"],
      ["Ubi keledek boleh ditanam daripada…", "Pucuk atau keratan batangnya", "Batu", "Biji bunga matahari", "Garam"],
      ["Bagaimanakah pokok ubi keledek tumbuh?", "Menjalar di atas tanah", "Terapung di udara", "Di dalam air sahaja", "Berdiri tinggi seperti pokok kelapa"],
      ["Alat apakah yang sesuai untuk menggali ubi supaya tidak luka?", "Garpu tanah", "Gunting kuku", "Sudu teh", "Penyapu"],
      ["Selepas berapa lama ubi keledek boleh dituai?", "90 hingga 120 hari", "5 hari", "2 tahun", "1 jam"]
    ]
  },
  {
    name: "Bunga dan Campuran", plant: "bunga",
    qs: [
      ["Berapa jam cahaya matahari diperlukan oleh bunga matahari?", "Kira-kira 8 jam", "1 jam", "Tidak perlu cahaya", "30 minit"],
      ["Berapa dalamkah biji bunga matahari ditanam?", "Kira-kira 2 cm", "1 meter", "Di atas tanah sahaja", "50 cm"],
      ["Mengapakah bunga matahari diberi nama begitu?", "Bunganya menghadap matahari", "Ia hanya tumbuh pada waktu malam", "Bunganya berwarna biru", "Ia tiada daun"],
      ["Apa yang kita dapat jika bunga matahari dibiarkan kering?", "Bijinya", "Air", "Ubi", "Lobak"],
      ["Apakah corak biji bunga matahari?", "Bergaris hitam dan putih", "Berbintik merah", "Biru kosong", "Berpetak kuning"],
      ["Antara berikut, yang manakah membesar di dalam tanah?", "Lobak merah", "Tomato", "Cili", "Bunga matahari"],
      ["Antara berikut, sayur manakah paling cepat boleh dituai?", "Kangkung", "Ubi keledek", "Bunga matahari", "Tomato"],
      ["Mengapakah sesetengah biji direndam sebelum ditanam?", "Supaya lebih cepat bercambah", "Supaya biji tenggelam selamanya", "Supaya warnanya berubah", "Supaya biji tidak tumbuh"]
    ]
  }
];
