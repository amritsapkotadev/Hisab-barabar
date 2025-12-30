export default function HowItWorks() {
  const steps = [
    {
      step: '1',
      title: 'Create a Group',
      description: 'Start by creating a group for your trip, event, or shared living space. Give it a fun name!',
      icon: '➕',
    },
    {
      step: '2',
      title: 'Invite Friends',
      description: 'Share the group code or QR code with your friends. They can join instantly.',
      icon: '📲',
    },
    {
      step: '3',
      title: 'Add Expenses',
      description: 'Add expenses as they happen. Choose how to split them - equally or custom amounts.',
      icon: '💳',
    },
    {
      step: '4',
      title: 'Settle Up',
      description: 'When it\'s time to settle, see exactly who owes whom and mark payments as settled.',
      icon: '✅',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How It{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started in minutes. It's simple, intuitive, and powerful.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line (hidden on mobile, shown on larger screens) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-purple-300 to-pink-300 -translate-x-1/2 z-0"></div>
              )}
              
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition relative z-10">
                <div className="text-6xl mb-4 text-center">{step.icon}</div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{step.title}</h3>
                <p className="text-gray-600 text-center">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
