// The title area above the tabs: screen title, short description, and item count.
function PageHeading({ title, subtitle, countLabel, count }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">INVENTORY MANAGEMENT</p>
        <h2>{title}</h2>
        <p className="subtitle">{subtitle}</p>
      </div>
      <div className="product-count">
        <span>{countLabel}</span>
        <strong>{count}</strong>
      </div>
    </div>
  );
}

export default PageHeading;
