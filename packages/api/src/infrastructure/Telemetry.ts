import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
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
 //           '@opentelemetry/instrumentation-fastify': {},
        }),
    ],
});

sdk.start();

const meter = metrics.getMeter('alentapp-api');

export function createREDMetrics() {
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

export function createObservables(activeRequests: {value: number}) {
    const memoryUsage = meter.createObservableGauge('process.memory.usage', {
        description: 'Uso de memoria',
        unit: 'By',
    });

    memoryUsage.addCallback((result) => {
        result.observe(process.memoryUsage().heapUsed);
    });

    const concurrentRequests = meter.createObservableGauge('http.requests.active', {
        description: 'Total de requests HTTP concurrentes',
    });
    concurrentRequests.addCallback((result) => {
        result.observe(activeRequests.value);
    });
}

export { sdk, meter, prometheusExporter };
