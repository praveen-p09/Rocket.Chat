import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { type Chart } from 'chart.js';
import { type RefObject } from 'react';

import { clearChart } from '../../../../../../app/livechat/client/lib/chartHandler';

type UseClearChartDataOptions = {
	context: RefObject<Chart | undefined>;
	canvas: RefObject<HTMLCanvasElement | null>;
};

export const useClearChartData = ({ context: contextRef, canvas: canvasRef }: UseClearChartDataOptions) =>
	useEffectEvent(async () => {
		if (!canvasRef?.current || !contextRef?.current) {
			return;
		}
		console.log('ding', contextRef.current?.data);

		await clearChart(contextRef.current);
	});
