import { FiCheck } from 'react-icons/fi';
import './Pricing.css';

const Pricing = () => {
    const plans = [
        {
            name: 'Starter',
            price: '$99',
            period: '/month',
            description: 'Perfect for small clinics just getting started',
            features: [
                'Up to 100 patients',
                'Basic appointment scheduling',
                'Patient records management',
                'Email support',
                'Mobile app access',
                '1 clinic location'
            ],
            highlighted: false
        },
        {
            name: 'Professional',
            price: '$299',
            period: '/month',
            description: 'Ideal for growing clinics and practices',
            features: [
                'Unlimited patients',
                'Advanced scheduling',
                'Complete patient management',
                'Billing & invoicing',
                'Priority support',
                'Up to 3 clinic locations',
                'Analytics & reports',
                'Custom branding'
            ],
            highlighted: true
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            period: '',
            description: 'For hospitals and large healthcare facilities',
            features: [
                'Everything in Professional',
                'Unlimited locations',
                'Multi-department support',
                'Advanced analytics',
                'Dedicated account manager',
                'Custom integrations',
                'On-premise deployment option',
                'SLA guarantee'
            ],
            highlighted: false
        }
    ];

    return (
        <section id="pricing" className="section">
            <div className="container">
                {/* Section Header */}
                <div className="section-header text-center fade-in-up">
                    <h2 className="section-title">Simple, Transparent Pricing</h2>
                    <p className="section-subtitle">
                        Choose the perfect plan for your healthcare facility
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="pricing-grid">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`pricing-card ${plan.highlighted ? 'highlighted' : ''} scale-in`}
                            style={{ animationDelay: `${0.1 + index * 0.15}s` }}
                        >
                            {plan.highlighted && <div className="popular-badge">Most Popular</div>}

                            <div className="pricing-header">
                                <h3 className="plan-name">{plan.name}</h3>
                                <p className="plan-description">{plan.description}</p>
                                <div className="price-wrapper">
                                    <span className="price">{plan.price}</span>
                                    <span className="period">{plan.period}</span>
                                </div>
                            </div>

                            <ul className="features-list">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="feature-item">
                                        <FiCheck size={20} className="check-icon" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'} btn-large pricing-cta`}>
                                {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Additional Info */}
                <div className="pricing-footer fade-in-up" style={{ animationDelay: '0.6s' }}>
                    <p className="pricing-note">
                        All plans include a <strong>30-day free trial</strong>. No credit card required.
                        Cancel anytime.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
