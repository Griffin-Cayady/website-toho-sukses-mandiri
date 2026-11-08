import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

// The site's one button system. Every button and button-like link uses these variants, so they share one shape (rounded-lg),
// one motion (300ms ease-out-expo: lift on hover, press on click) and one green. Do not hand-roll button classes elsewhere.

// A light that sweeps across a filled green button on hover (::before). Exported for the product card's quote row.
export const BUTTON_SHINE =
	'before:pointer-events-none before:absolute before:inset-y-0 before:-left-full before:-z-10 before:w-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 before:ease-out-expo hover:before:translate-x-[200%] motion-reduce:before:hidden';

// Lift on hover, settle and press on click; no lift for visitors who reduce motion.
const LIFT = 'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:hover:translate-y-0';

const buttonVariants = cva(
	// An icon marked `btn-arrow` (the arrow after a label) slides right on hover. It needs the marker: labels are bare text
	// nodes, which CSS child selectors don't see, so a trailing arrow can't be told from a leading icon (e.g. WhatsApp).
	// :hover sits inside the arbitrary variant: Tailwind 3 would put a `hover:` prefix on the icon, not on the button.
	'group/btn relative isolate inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_.btn-arrow]:transition-transform [&_.btn-arrow]:duration-300 [&_.btn-arrow]:ease-out-expo [&:hover_.btn-arrow]:translate-x-1',
	{
		variants: {
			variant: {
				// The main action: the client's bright green, glow and light sweep on hover.
				default: cn('bg-brand-action text-white shadow-soft hover:bg-brand-600 hover:shadow-brand', LIFT, BUTTON_SHINE),
				// The second action next to a green one.
				outline: cn('border border-gray-300 bg-white text-gray-800 shadow-soft hover:border-brand-700 hover:text-brand-700', LIFT),
				// On dark green sections and photos.
				inverse: cn('bg-white text-brand-800 shadow-soft hover:bg-brand-50 hover:shadow-lift', LIFT),
				glass: cn('border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20', LIFT),
				destructive: cn('bg-destructive text-destructive-foreground hover:bg-destructive/90', LIFT),
				secondary: cn('bg-secondary text-secondary-foreground hover:bg-gray-200', LIFT),
				// Icon controls and text actions: no lift.
				ghost: 'hover:bg-gray-100 hover:text-gray-900',
				link: 'text-brand-700 underline-offset-4 hover:underline',
			},
			size: {
				// 44px: the smallest comfortable tap target.
				default: 'h-11 px-5',
				sm: 'h-9 px-3',
				lg: 'h-12 px-6 text-[15px]',
				xl: 'h-14 px-7 text-base',
				icon: 'h-11 w-11',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			ref={ref}
			{...props}
		/>
	);
});
Button.displayName = 'Button';

export { Button, buttonVariants };
