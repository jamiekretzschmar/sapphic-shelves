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
    imageColor: 'bg-mustard-100 dark:bg-mustard-900/30',
  },
  {
    id: '2',
    title: 'Gideon the Ninth',
    store: 'Audible Sale',
    price: '$4.95',
    originalPrice: '$24.99',
    imageColor: 'bg-sage-100 dark:bg-sage-900/30',
  },
  {
    id: '3',
    title: 'This Is How You Lose the Time War',
    store: 'Kobo Store',
    price: '$1.99',
    originalPrice: '$12.99',
    imageColor: 'bg-earth-200 dark:bg-earth-800/50',
  },
  {
    id: '4',
    title: 'The Jasmine Throne',
    store: 'Barnes & Noble',
    price: '$5.00',
    originalPrice: '$16.99',
    imageColor: 'bg-stone-200 dark:bg-stone-800/50',
  },
  {
    id: '5',
    title: 'A Memory Called Empire',
    store: 'Google Play Books',
    price: '$3.99',
    originalPrice: '$14.99',
    imageColor: 'bg-mustard-200 dark:bg-mustard-800/50',
  }
];

export default function CuratedFinds() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-24">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-mustard-100 dark:bg-mustard-900/30 text-mustard-600 dark:text-mustard-400 mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-serif text-earth-900 dark:text-earth-100">Curated Finds</h2>
        <p className="text-earth-600 dark:text-earth-400 max-w-xl mx-auto">
          Discover current deals, ARCs, and free queer editions across the web.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6 px-4">
          <h3 className="text-2xl font-serif text-earth-900 dark:text-earth-100 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-sage-600 dark:text-sage-400" />
            Today's Deals
          </h3>
          <button className="text-sm font-bold uppercase tracking-widest text-earth-500 hover:text-earth-800 dark:hover:text-earth-200 transition-colors">
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
              className="w-72 shrink-0 snap-center bg-white dark:bg-earth-900 rounded-3xl shadow-soft border border-earth-100 dark:border-earth-800 overflow-hidden flex flex-col"
            >
              <div className={`h-48 w-full ${deal.imageColor} flex items-center justify-center p-6 relative`}>
                <div className="w-24 h-36 bg-white dark:bg-earth-800 shadow-vibe rounded-md border border-earth-200 dark:border-earth-700 flex items-center justify-center">
                  <span className="text-xs text-earth-400 font-serif text-center px-2">Cover</span>
                </div>
                <div className="absolute top-4 right-4 bg-white dark:bg-earth-900 text-earth-900 dark:text-earth-100 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  Sale
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <p className="text-xs text-sage-600 dark:text-sage-400 uppercase tracking-widest font-bold mb-2">
                  {deal.store}
                </p>
                <h4 className="font-serif text-xl text-earth-900 dark:text-earth-100 leading-tight mb-4 line-clamp-2">
                  {deal.title}
                </h4>
                
                <div className="mt-auto flex items-end justify-between">
                  <div>
                    <span className="text-sm text-earth-400 dark:text-earth-500 line-through mr-2">
                      {deal.originalPrice}
                    </span>
                    <span className="text-2xl font-bold text-earth-900 dark:text-earth-100">
                      {deal.price}
                    </span>
                  </div>
                  <button className="bg-earth-900 hover:bg-earth-800 dark:bg-earth-100 dark:hover:bg-white text-white dark:text-earth-900 rounded-full px-5 py-2.5 text-sm font-bold transition-colors flex items-center gap-2 shadow-soft">
                    Get Deal
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-4">
        <div className="bg-mustard-50 dark:bg-mustard-900/20 rounded-3xl p-8 border border-mustard-200 dark:border-mustard-800/50 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-lg">
            <h3 className="text-2xl font-serif text-earth-900 dark:text-earth-100 mb-2">Looking for ARCs?</h3>
            <p className="text-earth-600 dark:text-earth-400">
              Join our community newsletter to get weekly updates on upcoming queer releases and opportunities to read them early.
            </p>
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="px-6 py-3 rounded-full bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-700 focus:outline-none focus:ring-2 focus:ring-mustard-500/50 w-full sm:w-64 text-earth-900 dark:text-earth-100"
            />
            <button className="bg-mustard-600 hover:bg-mustard-700 text-white px-6 py-3 rounded-full font-bold transition-colors shadow-soft whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
