import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { MeterProvider, Meter } from '@opentelemetry/sdk-metrics';
import { metrics } from '@opentelemetry/api';

const prometheusExporter = new PrometheusExporter({
    port: 9464,
    endpoint: '/metrics',
});

const sdk = new NodeSDK({
    metricReader: prometheusExporter,
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-http': {},
            '@opentelemetry/instrumentation-fastify': {},
        }),
    ],
});

sdk.start();

const meter = metrics.getMeter('alentapp-api');

export function createREDMetrics(meter: Meter) {
    const requestCounter = meter.createCounter('http.requests.total', {
        description: 'Total de requests HTTP',
    });
    const errorCounter = meter.createCounter('http.requests.errors', {
        description: 'Total de errores HTTP',
    });
    const requestDuration = meter.createHistogram('http.requests.duration', {
        description: 'Duracion de requests',
        unit: 'ms',
    });
    return { requestCounter, errorCounter, requestDuration };
}

export function createObservables(meter: Meter) {
    const memoryUsage = meter.createObservableGauge('process.memory.usage', {
        description: 'Uso de memoria',
        unit: 'By',
    });
    const concurrentRequests = meter.createObservableGauge('http.requests.active', {
        description: 'Total de requests HTTP concurrentes',
    });
    return { memoryUsage, concurrentRequests };
}

export { sdk, meter, prometheusExporter };
