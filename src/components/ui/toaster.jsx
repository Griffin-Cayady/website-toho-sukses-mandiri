'use client';

import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';

// How long a toast stays (ms) unless it passes its own `duration`; Infinity keeps it until closed.
const TOAST_DURATION = 5000;

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider>
			{toasts.map(({ id, title, description, action, dismiss, duration = TOAST_DURATION, ...props }) => {
				return (
					// `dismiss` is store logic, not a DOM attribute: run it when the toast closes instead of spreading it onto the <li>.
					<Toast key={id} {...props} duration={duration} onOpenChange={(open) => !open && dismiss()}>
						<div className="grid min-w-0 flex-1 gap-0.5 pt-[9px]">
							{title && <ToastTitle>{title}</ToastTitle>}
							{description && (
								<ToastDescription>{description}</ToastDescription>
							)}
						</div>
						{action}
						<ToastClose />
					</Toast>
				);
			})}
			<ToastViewport />
		</ToastProvider>
	);
}