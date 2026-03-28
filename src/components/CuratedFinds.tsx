import React from 'react';
import { Sparkles, ShoppingBag, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_DEALS = [
  {
    id: '1',
    title: 'The Priory of the Orange Tree',
    store: 'Kindle Daily Deal',
    price: '$2.99',
    originalPrice: '$15.99',
    imageColor: 'bg-theme-card-blue',
  },
  {
    id: '2',
    title: 'Gideon the Ninth',
    store: 'Audible Sale',
    price: '$4.95',
    originalPrice: '$24.99',
    imageColor: 'bg-theme-card-yellow',
  },
  {
    id: '3',
    title: 'This Is How You Lose the Time War',
    store: 'Kobo Store',
    price: '$1.99',
    originalPrice: '$12.99',
    imageColor: 'bg-theme-card-olive',
  },
  {
    id: '4',
    title: 'The Jasmine Throne',
    store: 'Barnes & Noble',
    price: '$5.00',
    originalPrice: '$16.99',
    imageColor: 'bg-theme-earth-blue-light',
  },
  {
    id: '5',
    title: 'A Memory Called Empire',
    store: 'Google Play Books',
    price: '$3.99',
    originalPrice: '$14.99',
    imageColor: 'bg-theme-earth-olive-green-light',
  }
];

export default function CuratedFinds() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-24">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-accent1/20 text-theme-accent1 mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-serif text-theme-text">Curated Finds</h2>
        <p className="text-theme-text-secondary max-w-xl mx-auto">
          Discover current deals, ARCs, and free queer editions across the web.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6 px-4">
          <h3 className="text-2xl font-serif text-theme-text flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-theme-accent2" />
            Today's Deals
          </h3>
          <button className="text-sm font-bold uppercase tracking-widest text-theme-text-secondary hover:text-theme-text transition-colors">
            View All
          </button>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 px-4 hide-scrollbar">
          {MOCK_DEALS.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-72 shrink-0 snap-center bg-theme-surface rounded-3xl shadow-soft border border-theme-border overflow-hidden flex flex-col"
            >
              <div className={`h-48 w-full ${deal.imageColor} flex items-center justify-center p-6 relative`}>
                <div className="w-24 h-36 bg-theme-bg shadow-vibe rounded-md border border-theme-border flex items-center justify-center">
                  <span className="text-xs text-theme-text-secondary font-serif text-center px-2">Cover</span>
                </div>
                <div className="absolute top-4 right-4 bg-theme-surface text-theme-text text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  Sale
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <p className="text-xs text-theme-accent2 uppercase tracking-widest font-bold mb-2">
                  {deal.store}
                </p>
                <h4 className="font-serif text-xl text-theme-text leading-tight mb-4 line-clamp-2">
                  {deal.title}
                </h4>
                
                <div className="mt-auto flex items-end justify-between">
                  <div>
                    <span className="text-sm text-theme-text-secondary line-through mr-2">
                      {deal.originalPrice}
                    </span>
                    <span className="text-2xl font-bold text-theme-text">
                      {deal.price}
                    </span>
                  </div>
                  <button className="bg-theme-text hover:opacity-90 text-theme-bg rounded-full px-5 py-2.5 text-sm font-bold transition-colors flex items-center gap-2 shadow-soft">
                    Get Deal
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-4">
        <div className="bg-theme-accent1/10 rounded-3xl p-8 border border-theme-accent1/20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-lg">
            <h3 className="text-2xl font-serif text-theme-text mb-2">Looking for ARCs?</h3>
            <p className="text-theme-text-secondary">
              Join our community newsletter to get weekly updates on upcoming queer releases and opportunities to read them early.
            </p>
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="px-6 py-3 rounded-full bg-theme-surface border border-theme-border focus:outline-none focus:ring-2 focus:ring-theme-accent1/50 w-full sm:w-64 text-theme-text"
            />
            <button className="bg-theme-accent1 hover:bg-theme-accent1/90 text-white px-6 py-3 rounded-full font-bold transition-colors shadow-soft whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
