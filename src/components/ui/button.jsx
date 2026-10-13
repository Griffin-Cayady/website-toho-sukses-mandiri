import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default: 'bg-brand-600 text-white shadow-brand hover:bg-brand-700',
				destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
				outline:
          'border border-gray-300 bg-white text-gray-800 hover:border-brand-600 hover:text-brand-700',
				secondary:
          'bg-secondary text-secondary-foreground hover:bg-gray-200',
				ghost: 'hover:bg-gray-100 hover:text-gray-900',
				link: 'text-brand-700 underline-offset-4 hover:underline',
				inverse: 'bg-white text-brand-800 shadow-lift hover:bg-brand-50',
				glass: 'border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 px-3',
				lg: 'h-12 px-6 text-[15px]',
				xl: 'h-14 px-7 text-base',
				icon: 'h-10 w-10',
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
