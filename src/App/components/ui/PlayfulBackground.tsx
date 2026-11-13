import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Star, Sparkle, DotScatter } from '../iris/ui/brand/Decor';

/**
 * Ambient decorative backdrop.
 *
 * Every element here loops forever, which is the single largest source of
 * continuous motion in the app. It sits behind every screen, including the
 * learning task, so it is the first thing that must stop when the OS asks for
 * reduced motion — the blobs and emoji then render in their resting positions
 * and simply hold still. Nothing informational is lost: this layer is purely
 * decorative and is already `pointer-events-none` and unreadable by assistive
 * tech.
 */
export function PlayfulBackground() {
    const reduceMotion = useReducedMotion();
    // Brand colours, corner-weighted — the same arrangement the logo artwork
    // uses: colour pooled at the edges, warm white kept clear in the middle
    // where the content sits (BRAND_IDENTITY.md §6, "leave enough whitespace").
    const blobs = useMemo(() => [
        { id: 1, color: 'bg-brand-yellow', size: 'size-[26rem]', left: '-12%', top: '-12%', duration: 25 },
        { id: 2, color: 'bg-brand-blue', size: 'size-[28rem]', right: '-15%', top: '-8%', duration: 30 },
        { id: 3, color: 'bg-brand-coral', size: 'size-[24rem]', left: '-8%', bottom: '-12%', duration: 22 },
        { id: 4, color: 'bg-brand-green', size: 'size-[22rem]', right: '-10%', bottom: '-10%', duration: 28 },
    ], []);

    /**
     * Drawn brand marks, not emoji.
     *
     * Emoji render as a different artwork on every operating system, so the
     * backdrop looked like a different product on Windows, iOS and Android —
     * and none of those artworks belong to the IRIS identity. These are the
     * doodles from the logo instead: stars, sparkles and dot scatters, in
     * brand colours, identical everywhere.
     */
    const marks = useMemo(() => [
        { id: 'm1', kind: 'sparkle', color: '#1F67B1', left: '8%',  top: '16%', size: 44, duration: 18 },
        { id: 'm2', kind: 'star',    color: '#FECA34', left: '86%', top: '12%', size: 56, duration: 22 },
        { id: 'm3', kind: 'dots',    color: '',        left: '72%', top: '66%', size: 120, duration: 25 },
        { id: 'm4', kind: 'sparkle', color: '#F45B63', left: '6%',  top: '74%', size: 38, duration: 20 },
        { id: 'm5', kind: 'star',    color: '#49B87A', left: '90%', top: '42%', size: 34, duration: 14 },
    ], []);

    const stars = useMemo(() => {
        return [...Array(10)].map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            size: Math.random() * 15 + 15,
        }));
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-ground">
            {/* Dynamic Ambient Blobs - Simplified for performance */}
            {blobs.map((blob) => (
                <motion.div
                    key={blob.id}
                    className={`absolute rounded-full opacity-[0.07] blur-[100px] ${blob.color} ${blob.size}`}
                    style={{
                        left: blob.left,
                        top: blob.top,
                        right: blob.right,
                        bottom: blob.bottom,
                        willChange: 'transform',
                    }}
                    animate={reduceMotion ? undefined : {
                        x: [0, 40, 0],
                        y: [0, -40, 0],
                    }}
                    transition={reduceMotion ? { duration: 0 } : {
                        duration: blob.duration * 1.5,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            ))}

            {/* Drifting brand marks */}
            <div className="absolute inset-0 opacity-[0.10]">
                {marks.map((m) => (
                    <motion.div
                        key={m.id}
                        className="absolute"
                        style={{ left: m.left, top: m.top, width: m.size, willChange: 'transform' }}
                        animate={reduceMotion ? undefined : { y: [0, -18, 0] }}
                        transition={reduceMotion ? { duration: 0 } : {
                            duration: m.duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        {m.kind === 'star' && <Star color={m.color} className="w-full" />}
                        {m.kind === 'sparkle' && <Sparkle color={m.color} className="w-full" />}
                        {m.kind === 'dots' && <DotScatter className="w-full" />}
                    </motion.div>
                ))}
            </div>

            {/* A quiet scatter of small stars, placed once and held still. */}
            <div className="absolute inset-0 z-[1]">
                {stars.map((star) => (
                    <div
                        key={`star-${star.id}`}
                        className="absolute opacity-[0.18]"
                        style={{ left: star.left, top: star.top, width: `${star.size}px` }}
                    >
                        <Star color="#FECA34" className="w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
