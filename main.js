const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const https = require('https');


const excludedSrcList = [
  "http://esx.bigo.sg/live/g1/M00/05/71/nXfpBFlKHcSIEifkAAAVcvRcLE8AAIfoAKuzhYAABWK788.jpg",
  "http://esx.bigo.sg/live/g1/M00/05/71/nXfpBFlKHcSIEifkAAAVcvRcLE8AAIfoAKuzhYAABWK788.jpg",
  "https://giftesx.bigo.sg/live/3s4/0adZqb.png",
  "http://esx.bigo.sg/live/g1/M01/05/71/iwVsDllKHcSIcSjCAAAvIlo_Tp8AAIfnQOPU94AAC86608.jpg",
  "http://esx.bigo.sg/live/4hb/2XvADt.jpg",
  "http://esx.bigo.sg/live/4hb/1rzaYG.jpg"
];

// Функция для загрузки страницы по заданному ID
async function fetchPage(id) {
  const url = `https://www.bigo.tv/ru/user/${id}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при загрузке страницы ${url}: ${error.message}`);
    return null;
  }
}

// Функция для парсинга изображений из HTML-кода
function parseImages(html) {
  const $ = cheerio.load(html);
  const images = [];

  // Ищем все элементы с классом 'img-preview'
  $('.img-preview').each((index, element) => {
    const src = $(element).find('img').attr('src');
    images.push(src);
  });

  return images;
}

// Функция для сохранения изображений с использованием ID в названии файла
async function saveImages(images, id) {
  const folderPath = `./parsed images/`;

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  for (let index = 0; index < images.length; index++) {
    const src = images[index];

    // Проверка на пустые аватарки
    if (excludedSrcList.includes(src)) {
      console.log(`Изображение с ${src} не будет сохранено.`);
      continue;
    }

    const response = await axios({
      method: 'get',
      url: src,
      responseType: 'stream',
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false
      })
    });

    const filePath = `${folderPath}/${id}.jpg`;
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  console.log(`Изображение сохранены в папке ${folderPath}`);
}

// Функция для обработки диапазона ID
async function processIds(startId, endId) {
  for (let id = startId; id <= endId; id++) {
    console.log(id)
    const html = await fetchPage(id);

    if (html) {
      const images = parseImages(html);
      await saveImages(images, id);
    }
  }
}

const startUserId = 953372356;
const endUserId = 963361137;

// Запуск парсера
processIds(startUserId, endUserId);
