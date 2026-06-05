// Shared visual primitives — plain Bootstrap 5.3 markup as small React components.
const { useState: usePrim, useEffect: useEffectP } = React;

function StatusBadge({ status }) {
  const s = window.DD.STATUS[status] || { label: status, cls: 'text-bg-secondary' };
  return <span className={`badge rounded-pill ${s.cls}`}>{s.label}</span>;
}

function OrderNumber({ n }) {
  if (n == null) return <span className="text-secondary small">N° —</span>;
  return <span className="badge text-bg-dark">N° {n}</span>;
}

function QtyStepper({ value, onChange, min = 0 }) {
  return (
    <div className="btn-group btn-group-sm" role="group" aria-label="Quantità">
      <button
        className="btn btn-outline-secondary"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="btn btn-light disabled" style={{ minWidth: 40 }}>
        {value}
      </span>
      <button className="btn btn-outline-secondary" onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

// Phone frame for the mobile customer surface
function Phone({ children, label }) {
  return (
    <div className="dd-phone-wrap">
      {label && <div className="text-secondary small fw-medium mb-2 text-center">{label}</div>}
      <div className="dd-phone">
        <div className="dd-phone-notch" aria-hidden="true"></div>
        <div className="dd-phone-screen">{children}</div>
      </div>
    </div>
  );
}

// Light staff navbar (gestore / lavoratore)
function StaffNavbar({ role, tabs, active, onTab, user, onLogout }) {
  return (
    <nav className="navbar navbar-expand bg-body-tertiary border-bottom">
      <div className="container-fluid px-3">
        <span className="navbar-brand mb-0 fw-bold">
          DishDash · <span className="dd-brand">{role}</span>
        </span>
        <ul className="navbar-nav me-auto">
          {tabs.map((t) => (
            <li className="nav-item" key={t}>
              <a
                className={`nav-link${t === active ? ' active' : ''}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onTab && onTab(t);
                }}
              >
                {t}
              </a>
            </li>
          ))}
        </ul>
        <span className="navbar-text small me-3 d-none d-md-inline">{user}</span>
        {onLogout && (
          <button className="btn btn-sm btn-outline-secondary" onClick={onLogout}>
            Esci
          </button>
        )}
      </div>
    </nav>
  );
}

// Dark superuser navbar
function AdminNavbar({ tabs, active, onTab, user, onLogout }) {
  return (
    <nav className="navbar navbar-expand bg-dark border-bottom border-body" data-bs-theme="dark">
      <div className="container-fluid px-3">
        <span className="navbar-brand mb-0 fw-bold">
          DishDash · <span className="dd-brand">Superuser</span>
        </span>
        <ul className="navbar-nav me-auto">
          {tabs.map((t) => (
            <li className="nav-item" key={t}>
              <a
                className={`nav-link${t === active ? ' active' : ''}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onTab && onTab(t);
                }}
              >
                {t}
              </a>
            </li>
          ))}
        </ul>
        <span className="navbar-text small me-3 d-none d-md-inline">{user}</span>
        {onLogout && (
          <button className="btn btn-sm btn-outline-light" onClick={onLogout}>
            Esci
          </button>
        )}
      </div>
    </nav>
  );
}

// Lightweight Bootstrap-styled modal (no JS dependency)
function Modal({ title, onClose, children, footer }) {
  useEffectP(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div
      className="dd-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog" role="dialog" aria-modal="true">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Chiudi"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

// A QR glyph rendered with CSS (the repo has no real QR images — flagged placeholder)
function QrGlyph({ size = 96 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background:
          'repeating-conic-gradient(#212529 0 25%, #fff 0 50%) 0 0/' +
          Math.round(size / 6) +
          'px ' +
          Math.round(size / 6) +
          'px',
        border: '4px solid #212529',
        borderRadius: 6
      }}
    ></div>
  );
}

Object.assign(window, {
  StatusBadge,
  OrderNumber,
  QtyStepper,
  Phone,
  StaffNavbar,
  AdminNavbar,
  Modal,
  QrGlyph
});
