import './AboutPage.css';

const STATS = [
  { value: '10+', label: 'Năm kinh nghiệm' },
  { value: '50K+', label: 'Khách hàng tin tưởng' },
  { value: '5K+', label: 'Sản phẩm chính hãng' },
  { value: '30+', label: 'Chi nhánh toàn quốc' },
];

const TEAM_MEMBERS = [
  {
    name: 'Nguyễn Văn Minh',
    role: 'CEO & Founder',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    desc: '15 năm kinh nghiệm trong ngành công nghệ, sáng lập HenzoStore với sứ mệnh mang đến sản phẩm công nghệ chính hãng cho mọi người.',
  },
  {
    name: 'Trần Thị Lan',
    role: 'Giám đốc Kinh doanh',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    desc: 'Chịu trách nhiệm chiến lược kinh doanh và mở rộng thị trường trên toàn quốc.',
  },
  {
    name: 'Lê Hoàng Nam',
    role: 'Giám đốc Kỹ thuật',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    desc: 'Đảm bảo chất lượng sản phẩm và dịch vụ hậu mãi tốt nhất cho khách hàng.',
  },
  {
    name: 'Phạm Thu Hà',
    role: 'Trưởng phòng CSKH',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    desc: 'Xây dựng đội ngũ tư vấn chuyên nghiệp, hỗ trợ khách hàng 24/7.',
  },
];

const TIMELINE = [
  { year: '2014', event: 'Thành lập công ty tại TP. Hồ Chí Minh với cửa hàng đầu tiên.' },
  { year: '2016', event: 'Mở rộng chi nhánh tại Hà Nội, phục vụ hơn 10.000 khách hàng.' },
  { year: '2018', event: 'Ra mắt website thương mại điện tử HenzoStore.vn.' },
  { year: '2020', event: 'Đạt 100.000 đơn hàng online, mở rộng kho hàng tại Đà Nẵng.' },
  { year: '2022', event: 'HenzoStore có mặt tại 20 tỉnh thành với hơn 30 chi nhánh.' },
  { year: '2024', event: 'Trở thành đối tác authorized của Apple, Samsung, ASUS, MSI.' },
];

const CORE_VALUES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Chính hãng 100%',
    desc: 'Tất cả sản phẩm được nhập khẩu chính hãng, có bill xuất xứ rõ ràng và bảo hành đầy đủ.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Giao hàng nhanh chóng',
    desc: 'TP.HCM & Hà Nội: giao trong 24h. Các tỉnh: 2-4 ngày với đội ngũ vận chuyển chuyên nghiệp.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    title: 'Hậu mãi tận tâm',
    desc: 'Bảo hành 1-2 năm, đổi trả trong 7 ngày, đội ngũ kỹ thuật hỗ trợ 24/7.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: 'Giá cả cạnh tranh',
    desc: 'Cam kết giá tốt nhất thị trường, nhiều chương trình khuyến mãi hấp dẫn quanh năm.',
  },
];

export const AboutPage = () => {
  return (
    <div className="about-page">
      {/* Hero */}
      <div className="about-hero">
        <div className="container">
          <h1 className="about-hero__title">Về HenzoStore</h1>
          <p className="about-hero__subtitle">
            Sứ mệnh của chúng tôi là mang đến công nghệ chính hãng, chất lượng cao với giá cả hợp lý cho mọi người Việt.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Stats */}
        <div className="about-stats">
          {STATS.map((s, i) => (
            <div key={i} className="about-stat">
              <span className="about-stat__value">{s.value}</span>
              <span className="about-stat__label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className="about-section">
          <div className="about-section__content">
            <h2 className="about-section__title">Câu chuyện của HenzoStore</h2>
            <p>
              Khởi nguồn từ niềm đam mê công nghệ và mong muốn đưa những sản phẩm công nghệ hàng đầu thế giới đến gần hơn với người Việt, HenzoStore được thành lập vào năm 2014 bởi một nhóm những người trẻ đầy nhiệt huyết.
            </p>
            <p>
              Trải qua hơn 10 năm phát triển, HenzoStore đã trở thành một trong những nhà phân phối công nghệ uy tín hàng đầu Việt Nam với hệ thống 30+ chi nhánh và cửa hàng trên toàn quốc, phục vụ hơn 50.000 khách hàng tin tưởng lựa chọn.
            </p>
            <p>
              Chúng tôi tự hào là đối tác authorized của các thương hiệu lớn như Apple, Samsung, ASUS, MSI, Logitech, Sony, và nhiều thương hiệu công nghệ nổi tiếng khác.
            </p>
          </div>
          <div className="about-section__image">
            <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600" alt="HenzoStore team" />
          </div>
        </div>

        {/* Values */}
        <div className="about-section about-section--centered">
          <h2 className="about-section__title">Giá trị cốt lõi</h2>
          <div className="about-values-grid">
            {CORE_VALUES.map((v, i) => (
              <div key={i} className="about-value-card card">
                <div className="about-value-card__icon">{v.icon}</div>
                <h3 className="about-value-card__title">{v.title}</h3>
                <p className="about-value-card__desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="about-section">
          <h2 className="about-section__title">Hành trình phát triển</h2>
          <div className="about-timeline">
            {TIMELINE.map((t, i) => (
              <div key={i} className="about-timeline__item">
                <div className="about-timeline__year">{t.year}</div>
                <div className="about-timeline__dot" />
                <div className="about-timeline__content">
                  <p>{t.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="about-section about-section--centered">
          <h2 className="about-section__title">Đội ngũ lãnh đạo</h2>
          <div className="about-team-grid">
            {TEAM_MEMBERS.map((m, i) => (
              <div key={i} className="about-team-card card">
                <img src={m.avatar} alt={m.name} className="about-team-card__avatar" />
                <h3 className="about-team-card__name">{m.name}</h3>
                <span className="about-team-card__role">{m.role}</span>
                <p className="about-team-card__desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
