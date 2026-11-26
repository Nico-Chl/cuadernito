// Génère les icônes PNG de la PWA à partir de public/icon.svg
import sharp from 'sharp'
for (const size of [192, 512]) {
  await sharp('public/icon.svg').resize(size, size).png().toFile(`public/icon-${size}.png`)
}
