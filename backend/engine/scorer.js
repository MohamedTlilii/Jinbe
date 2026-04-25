// engine/scorer.js
const scoreLead = (dateCreation, scoreSecteur) => {
  let fraicheur = 0;
  if (dateCreation) {
    const ageJours = Math.floor((Date.now() - new Date(dateCreation).getTime()) / 86400000);
    if (ageJours <= 30)       fraicheur = 3;
    else if (ageJours <= 90)  fraicheur = 2;
    else if (ageJours <= 365) fraicheur = 1;
  }
  const secteur = scoreSecteur || 0;
  const total   = Math.max(1, Math.min(6, fraicheur + secteur));
  return { score: total, scoreDetails: { fraicheur, secteur } };
};

module.exports = { scoreLead };
