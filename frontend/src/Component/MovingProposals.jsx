import React from 'react';
import { motion } from 'framer-motion';

const MovingProposals = () => {
  const proposals = [...Array(10)];

  return (
    <div className='w-full overflow-hidden flex items-center'>
      <motion.div 
        className='flex flex-nowrap'
        animate={{ x: ['0%', '-100%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ width: '200%', display: 'flex' }} // Ensures seamless looping
      >
        {[...proposals, ...proposals].map((_, i) => (
          <div key={i} className='w-[280px] h-[200px] text-white border border-red-500 text-sm pt-5 flex-shrink-0 gap-5 ml-3 bg-gray-800 rounded-lg p-4'>
            Proposal {i % 10 + 1}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default MovingProposals;
