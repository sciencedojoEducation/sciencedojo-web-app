import { SpanStatusCode, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("sciencedojo-public-render");

export async function traceServerOperation<T>(name: string, operation: () => Promise<T>) {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      return await operation();
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}
