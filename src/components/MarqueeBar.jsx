export default function MarqueeBar() {
  const items = [
    'Spanish Tomato', 'Peri Peri Magic', 'Sour & Onion Cream', 'Classic Normal',
    '', 'Handpicked Bananas', 'Made in India',
    'Spanish Tomato', 'Peri Peri Magic', 'Sour & Onion Cream', 'Classic Normal',
    '', 'Handpicked Bananas', 'Made in India',
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
