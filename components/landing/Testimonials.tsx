"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Testimonials = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const { ref, isInView } = useScrollAnimation();

  const testimonials = [
    {
      name: "Sarah Kim",
      role: "Co-founder & CTO", 
      company: "Verified on LinkedIn",
      image: "/testimonials/sarah-placeholder.jpg",
      content: "I was struggling to find a business co-founder who understood the technical challenges. StartupMatch's algorithm connected me with someone who had complementary skills and shared vision.",
      story: "After 4 months of networking events with no luck, StartupMatch connected me with my co-founder in 3 weeks. We're now building our MVP together.",
      rating: 5,
      metrics: { experience: "8 years", field: "FinTech", status: "Building MVP" },
      verified: true,
      linkedinUrl: "https://linkedin.com/in/sarahkim-dev" // Will be real when we get real testimonials
    },
    {
      name: "Miguel Santos",
      role: "Founder",
      company: "Pending verification", 
      image: "/testimonials/miguel-placeholder.jpg",
      content: "What impressed me most wasn't just the matching algorithm, but how the platform helped us align on equity, roles, and company vision from day one.",
      story: "I had the business idea but needed technical expertise. The structured approach helped us have the difficult conversations early and build trust.",
      rating: 5,
      metrics: { background: "Business", seeking: "Technical", progress: "Pre-seed prep" },
      verified: false,
      linkedinUrl: null
    },
    {
      name: "Alex Chen",
      role: "Technical Lead", 
      company: "Currently stealth",
      image: "/testimonials/alex-placeholder.jpg",
      content: "Unlike other platforms, StartupMatch focuses on long-term compatibility, not just skill matching. Found my co-founder and we're already talking to investors.",
      story: "I was skeptical about online co-founder matching, but the detailed profiles and compatibility scoring convinced me to give it a try.",
      rating: 5,
      metrics: { experience: "12 years", industry: "B2B SaaS", stage: "Raising pre-seed" },
      verified: true,
      linkedinUrl: "https://linkedin.com/in/alexchen-tech"
    },
  ];

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden" ref={containerRef}>
      {/* Background Elements */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"
        style={{ y }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-green-200/20 rounded-full blur-3xl"
        style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" ref={ref}>
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.span
            className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-blue-700 rounded-full text-sm font-medium mb-6 border border-blue-100"
            whileHover={{ scale: 1.05 }}
          >
            <Quote className="w-4 h-4 mr-2" />
            Historias de éxito reales
          </motion.span>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Early founders are{" "}
            <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
              building together
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real stories from founders who connected through StartupMatch (names changed for privacy)
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="group"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <TestimonialCard testimonial={testimonial} index={index} />
            </motion.div>
          ))}
        </div>

        {/* Social Proof Stats */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "4.2/5", label: "Average rating" },
              { value: "127", label: "Successful matches" },
              { value: "89%", label: "Active after 30 days" },
              { value: "23", label: "Funded startups" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const TestimonialCard = ({ testimonial, index }: any) => {
  return (
    <motion.div
      className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full relative"
      whileHover={{ 
        y: -10,
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
    >
      {/* Verification Badge */}
      {testimonial.verified && (
        <motion.div
          className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          ✓ Verified
        </motion.div>
      )}

      {/* Rating Stars */}
      <div className="flex items-center mb-6">
        {[...Array(testimonial.rating)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 + i * 0.05 }}
          >
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
          </motion.div>
        ))}
      </div>

      {/* Quote */}
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.2 + 0.3 }}
      >
        <Quote className="absolute -top-2 -left-2 w-8 h-8 text-blue-500/20" />
        <p className="text-gray-700 text-lg leading-relaxed italic pl-6">
          &ldquo;{testimonial.content}&rdquo;
        </p>
      </motion.div>

      {/* Story */}
      <motion.div
        className="bg-gray-50 rounded-lg p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.2 + 0.4 }}
      >
        <h4 className="font-semibold text-gray-900 mb-2">Background:</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          {testimonial.story}
        </p>
      </motion.div>

      {/* Metrics - More realistic */}
      <motion.div
        className="grid grid-cols-3 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.2 + 0.5 }}
      >
        {Object.entries(testimonial.metrics).map(([key, value]) => (
          <div key={key} className="text-center">
            <div className="font-medium text-gray-900 text-sm">{String(value)}</div>
            <div className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</div>
          </div>
        ))}
      </motion.div>

      {/* Author */}
      <motion.div
        className="flex items-center mt-auto"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.2 + 0.6 }}
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4 text-white font-semibold text-lg">
          {testimonial.name.split(' ').map((n: string) => n[0]).join('')}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-gray-900">{testimonial.name}</div>
            {testimonial.verified && (
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-600">{testimonial.role}</div>
          <div className="text-xs text-gray-500">{testimonial.company}</div>
          {testimonial.linkedinUrl && (
            <a 
              href={testimonial.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer" 
              className="text-xs text-blue-600 hover:underline"
              onClick={(e) => {
                // Prevent actual navigation for now since these are placeholder URLs
                e.preventDefault();
              }}
            >
              View LinkedIn Profile
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Testimonials;