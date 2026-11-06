import { useState } from 'react';
import { Icon } from '../../../components/common/Icon';
import './FAQPage.css';

const FAQ_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'order', label: 'Đơn hàng' },
  { id: 'payment', label: 'Thanh toán' },
  { id: 'shipping', label: 'Vận chuyển' },
  { id: 'warranty', label: 'Bảo hành' },
  { id: 'product', label: 'Sản phẩm' },
];

const FAQ_DATA = [
  {
    id: 1,
    category: 'order',
    question: 'Làm sao để đặt hàng trên HenzoStore?',
    answer: 'Bạn có thể đặt hàng qua website henzo.vn, ứng dụng di động, hoặc gọi điện trực tiếp qua hotline 1900 1234. Chọn sản phẩm, thêm vào giỏ hàng, điền thông tin giao hàng và chọn phương thức thanh toán phù hợp.',
  },
  {
    id: 2,
    category: 'order',
    question: 'Tôi có thể hủy hoặc thay đổi đơn hàng không?',
    answer: 'Bạn có thể hủy hoặc thay đổi đơn hàng trong vòng 1 giờ sau khi đặt, trước khi đơn hàng được xác nhận. Vui lòng liên hệ hotline hoặc chat trực tiếp để được hỗ trợ nhanh nhất.',
  },
  {
    id: 3,
    category: 'order',
    question: 'Làm sao theo dõi trạng thái đơn hàng?',
    answer: 'Sau khi đặt hàng thành công, bạn sẽ nhận mã đơn hàng qua email và SMS. Truy cập trang "Theo dõi đơn hàng" trên website, nhập mã đơn để xem chi tiết trạng thái. Bạn cũng có thể đăng nhập vào tài khoản để xem lịch sử đơn hàng.',
  },
  {
    id: 4,
    category: 'payment',
    question: 'HenzoStore hỗ trợ những phương thức thanh toán nào?',
    answer: 'Chúng tôi hỗ trợ: Thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, thanh toán qua VNPay, ví điện tử (MoMo, ZaloPay), và trả góp 0% qua thẻ tín dụng hoặc công cụ trả góp của các ngân hàng đối tác.',
  },
  {
    id: 5,
    category: 'payment',
    question: 'Tôi có thể thanh toán trả góp không?',
    answer: 'Có, HenzoStore hỗ trợ trả góp 0% lãi suất với thời hạn 3-12 tháng qua thẻ tín dụng của các ngân hàng: Vietcombank, Techcombank, VPBank, BIDV và nhiều ngân hàng khác. Điều kiện: thẻ tín dụng có hạn mức đủ và còn hiệu lực.',
  },
  {
    id: 6,
    category: 'payment',
    question: 'Thông tin thanh toán của tôi có bảo mật không?',
    answer: 'Tất cả giao dịch thanh toán trên HenzoStore được mã hóa bằng công nghệ SSL 256-bit. Chúng tôi không lưu trữ thông tin thẻ của bạn trên hệ thống. Thanh toán qua VNPay và các ví điện tử đều tuân thủ tiêu chuẩn bảo mật quốc tế PCI-DSS.',
  },
  {
    id: 7,
    category: 'shipping',
    question: 'Thời gian giao hàng mất bao lâu?',
    answer: 'TP. Hồ Chí Minh & Hà Nội: 1-2 ngày làm việc. Các thành phố lớn: 2-3 ngày. Các tỉnh thành khác: 3-5 ngày. Đơn hàng trước 15h sẽ được giao trong ngày (nội thành).',
  },
  {
    id: 8,
    category: 'shipping',
    question: 'Phí vận chuyển được tính như thế nào?',
    answer: 'Miễn phí vận chuyển cho đơn hàng từ 500.000đ trở lên tại TP.HCM và Hà Nội. Các khu vực khác, phí ship từ 25.000đ - 50.000đ tùy địa điểm. Đơn hàng từ 1.000.000đ được miễn phí ship toàn quốc.',
  },
  {
    id: 9,
    category: 'shipping',
    question: 'Tôi có thể chọn giờ giao hàng cụ thể không?',
    answer: 'Hiện tại chúng tôi chưa hỗ trợ chọn giờ giao cụ thể. Tuy nhiên, đội ngũ giao hàng sẽ gọi điện xác nhận trước khi giao. Bạn có thể yêu cầu giao vào khung giờ mong muốn trong phần ghi chú đơn hàng, chúng tôi sẽ cố gắng đáp ứng.',
  },
  {
    id: 10,
    category: 'warranty',
    question: 'Chính sách bảo hành như thế nào?',
    answer: 'Tất cả sản phẩm chính hãng được bảo hành theo chính sách của nhà sản xuất: iPhone/iPad/Mac: 12 tháng tại trung tâm Apple. Samsung: 12 tháng tại trung tâm bảo hành Samsung. Laptop/PC: 12-36 tháng tùy sản phẩm. Phụ kiện: 6-12 tháng.',
  },
  {
    id: 11,
    category: 'warranty',
    question: 'Chính sách đổi trả sản phẩm?',
    answer: 'Đổi trả trong 7 ngày đối với sản phẩm lỗi từ nhà sản xuất (được xác nhận bởi trung tâm bảo hành). Sản phẩm đổi trả phải còn nguyên seal, hộp, phụ kiện đi kèm và không có dấu hiệu sử dụng. Quý khách vui lòng giữ hóa đơn mua hàng.',
  },
  {
    id: 12,
    category: 'warranty',
    question: 'Sản phẩm điện thoại có được bảo hành điểm bán hàng không?',
    answer: 'Tùy sản phẩm: iPhone chính hãng VN/A được bảo hành tại tất cả trung tâm Apple Việt Nam và HenzoStore. Samsung chính hãng VN/A được bảo hành tại trung tâm Samsung và HenzoStore. Điện thoại xách tay không được bảo hành tại Việt Nam.',
  },
  {
    id: 13,
    category: 'product',
    question: 'Làm sao phân biệt hàng chính hãng và hàng xách tay?',
    answer: 'Hàng chính hãng VN/A có đầy đủ hóa đơn, tem nhập khẩu chính hãng, bảo hành tại Việt Nam, hộp có mã model VN/A. Hàng xách tay thường không có bảo hành Việt Nam, có thể có hạn chế về ngôn ngữ và tính năng. HenzoStore cam kết chỉ bán hàng chính hãng 100%.',
  },
  {
    id: 14,
    category: 'product',
    question: 'Tôi muốn mua sỉ/buôn thì liên hệ ai?',
    answer: 'HenzoStore có chương trình dành cho khách hàng mua sỉ với giá ưu đãi. Vui lòng liên hệ phòng kinh doanh: email wholesale@henzo.vn hoặc hotline 0901 234 567 (Mr. Minh) để được tư vấn về giá sỉ và chính sách hợp tác.',
  },
  {
    id: 15,
    category: 'product',
    question: 'Sản phẩm có sẵn hàng hay cần đặt trước?',
    answer: 'Hầu hết sản phẩm tại HenzoStore có sẵn trong kho. Một số sản phẩm cao cấp hoặc màu sắc hiếm có thể cần đặt trước 3-7 ngày. Trên website, trạng thái "Còn hàng" nghĩa là có thể giao ngay. Trạng thái "Đặt trước" cần chờ từ 3-14 ngày.',
  },
];

export const FAQPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [openId, setOpenId] = useState<number | null>(null);

  const filtered = activeCategory === 'all'
    ? FAQ_DATA
    : FAQ_DATA.filter(f => f.category === activeCategory);

  return (
    <div className="faq-page container">
      <div className="faq-hero">
        <h1 className="faq-hero__title">Câu hỏi thường gặp</h1>
        <p className="faq-hero__subtitle">
          Tìm câu trả lời nhanh cho những câu hỏi phổ biến nhất về dịch vụ của HenzoStore.
        </p>
      </div>

      <div className="faq-layout">
        <div className="faq-sidebar">
          <nav className="faq-nav">
            {FAQ_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`faq-nav__item ${activeCategory === cat.id ? 'faq-nav__item--active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </nav>

          <div className="faq-contact card">
            <h3 className="faq-contact__title">Không tìm thấy câu trả lời?</h3>
            <p className="faq-contact__desc">Liên hệ đội ngũ hỗ trợ của chúng tôi</p>
            <a href="/contact" className="btn btn-primary btn-sm">Liên hệ ngay</a>
            <a href="tel:19001234" className="faq-contact__phone">
              <Icon name="phone-call" size={14} />
              1900 1234
            </a>
          </div>
        </div>

        <div className="faq-content">
          <p className="faq-content__count">{filtered.length} câu hỏi</p>
          <div className="faq-list">
            {filtered.map(item => (
              <div
                key={item.id}
                className={`faq-item card ${openId === item.id ? 'faq-item--open' : ''}`}
              >
                <button
                  className="faq-item__question"
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                >
                  <span>{item.question}</span>
                  <svg
                    className="faq-item__arrow"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {openId === item.id && (
                  <div className="faq-item__answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
