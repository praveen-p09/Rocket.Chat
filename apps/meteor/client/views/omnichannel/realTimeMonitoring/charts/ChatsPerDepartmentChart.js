import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef, useEffect } from 'react';

import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import Chart from './Chart';
import { useClearChartData } from './hooks/useClearChartData';
import { useUpdateChartData } from './useUpdateChartData';

const init = (canvas, context, t) =>
	drawLineChart(canvas, context, [t('Open'), t('Closed')], [], [[], []], {
		legends: true,
		anim: false,
		smallTicks: true,
	});

const ChatsPerDepartmentChart = ({ params, reloadRef, ...props }) => {
	const t = useTranslation();

	const canvas = useRef();
	const context = useRef();
	const prevDataLabels = useRef();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
	});

	const clearChartData = useClearChartData({
		context,
		canvas,
	});

	const {
		value: chartData,
		phase: state,
		reload,
	} = useEndpointData('/v1/livechat/analytics/dashboards/charts/chats-per-department', { params });

	reloadRef.current.chatsPerDepartmentChart = reload;

	useEffect(() => {
		const initChart = async () => {
			context.current = await init(canvas.current, context.current, t);
		};
		initChart();
	}, [t]);

	useEffect(() => {
		console.log(state);
		if (state === AsyncStatePhase.RESOLVED) {
			if (chartData && chartData.success) {
				const { success, ...filteredChartData } = chartData;

				// TODO: Refactor updateChartData to better handle line charts
				if (JSON.stringify(prevDataLabels?.current) !== JSON.stringify(Object.keys(filteredChartData))) {
					clearChartData();
				}
				Object.entries(filteredChartData).forEach(([name, value]) => {
					updateChartData(name, [value.open, value.closed]);
				});
			} else {
				clearChartData();
			}
		}
	}, [chartData, clearChartData, state, updateChartData]);

	return <Chart ref={canvas} {...props} />;
};

export default ChatsPerDepartmentChart;
