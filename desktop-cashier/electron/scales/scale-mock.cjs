/** Эмуляция весов для разработки (POS_SCALE_MOCK=1). */

function createMockReader(onReading) {
  let timer = null;
  let tick = 0;

  const start = () => {
    if (timer) return;
    timer = setInterval(() => {
      tick += 1;
      const kg = Math.round((0.108 + (tick % 5) * 0.001) * 1000) / 1000;
      onReading({ kg, stable: tick % 2 === 0, raw: `MOCK ${kg} kg` });
    }, 800);
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  return { start, stop };
}

module.exports = { createMockReader };
