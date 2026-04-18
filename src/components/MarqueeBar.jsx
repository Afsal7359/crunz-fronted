export default function MarqueeBar() {
  const items = [
    'Spanish Tomato', 'Peri Peri Magic', 'Sour & Onion Cream', 'Classic Normal',
    '100% Natural', 'Zero Preservatives', 'Handpicked Bananas', 'Made in UK',
    'Spanish Tomato', 'Peri Peri Magic', 'Sour & Onion Cream', 'Classic Normal',
    '100% Natural', 'Zero Preservatives', 'Handpicked Bananas', 'Made in UK',
  ];
  return (
    <div className="marquee">
      <div className="mq-track">
        {items.map((item, i) => (
          <div key={i} className="mq-item">{item}</div>
        ))}
      </div>
    </div>
  );
}
