'use client';

import { cn } from '@/lib/utils';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';
import { CheckCircleIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react';
import React from 'react';

const ToastProvider = ToastPrimitives.Provider;

// Top right, so a toast never covers the back office's save bar at the bottom of the screen.
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
	<ToastPrimitives.Viewport
		ref={ref}
		className={cn(
			'toast-viewport fixed inset-x-0 top-0 z-toast flex max-h-screen w-full flex-col gap-3 p-4 outline-none sm:left-auto sm:right-0 sm:max-w-[420px] sm:p-6',
			className,
		)}
		{...props}
	/>
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
	'toast group pointer-events-auto relative flex w-full items-start gap-3.5 overflow-hidden rounded-2xl bg-white p-4 pr-12 shadow-lift ring-1 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[swipe=cancel]:transition-transform',
	{
		variants: {
			variant: {
				default: 'ring-gray-200/80 text-gray-900',
				destructive: 'destructive ring-red-200 text-gray-900',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);

const VARIANT_ICON = {
	default: { Icon: CheckCircleIcon, tile: 'bg-brand-50 text-brand-600 ring-brand-100', bar: 'bg-brand-600' },
	destructive: { Icon: WarningCircleIcon, tile: 'bg-red-50 text-red-600 ring-red-100', bar: 'bg-red-500' },
};

// `duration` (ms) draws a bar along the bottom that runs down until the toast closes; Infinity shows none.
const Toast = React.forwardRef(({ className, variant = 'default', duration, children, ...props }, ref) => {
	const { Icon, tile, bar } = VARIANT_ICON[variant] ?? VARIANT_ICON.default;
	return (
		<ToastPrimitives.Root
			ref={ref}
			duration={duration}
			className={cn(toastVariants({ variant }), className)}
			{...props}
		>
			<span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', tile)} aria-hidden="true">
				<Icon className="h-[22px] w-[22px]" weight="fill" />
			</span>
			{children}
			{Number.isFinite(duration) && (
				<span
					className={cn('toast-timer absolute inset-x-0 bottom-0 h-[3px] origin-left opacity-80', bar)}
					style={{ animationDuration: `${duration}ms` }}
					aria-hidden="true"
				/>
			)}
		</ToastPrimitives.Root>
	);
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
	<ToastPrimitives.Action
		ref={ref}
		className={cn(
			'inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800 transition-colors hover:border-brand-600 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:hover:border-red-500 group-[.destructive]:hover:text-red-700',
			className,
		)}
		{...props}
	/>
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
	<ToastPrimitives.Close
		ref={ref}
		className={cn(
			'absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
			className,
		)}
		toast-close=""
		{...props}
	>
		<XIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
		<span className="sr-only">Tutup</span>
	</ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
	<ToastPrimitives.Title
		ref={ref}
		className={cn('text-[15px] font-semibold leading-snug text-gray-900', className)}
		{...props}
	/>
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
	<ToastPrimitives.Description
		ref={ref}
		className={cn('text-sm leading-relaxed text-gray-600 [overflow-wrap:anywhere]', className)}
		{...props}
	/>
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
	Toast,
	ToastAction,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
};
