import { useMemo, useState } from 'react';
import titanicData from './data/titanic.json';
import './App.css';

type Embarkation = 'Cherbourg' | 'Queenstown' | 'Southampton' | 'Unknown';
type ClassFilter = 'all' | TitanicPassenger['passengerClass'];
type EmbarkationFilter = 'all' | Embarkation;
type ChartDimension = 'sex' | 'passengerClass' | 'embarked';

interface TitanicPassenger {
  id: string;
  age: number | null;
  sex: 'female' | 'male';
  passengerClass: 1 | 2 | 3;
  fare: number | null;
  embarked: Embarkation;
  survived: boolean;
}

interface SurvivalSegment {
  key: string;
  label: string;
  count: number;
  survivedCount: number;
  survivalRate: number;
}

const classOptions: ClassFilter[] = ['all', 1, 2, 3];
const embarkationOptions: EmbarkationFilter[] = [
  'all',
  'Cherbourg',
  'Queenstown',
  'Southampton',
  'Unknown',
];
const chartDimensionOptions: Array<{
  label: string;
  value: ChartDimension;
}> = [
  { label: 'Sex', value: 'sex' },
  { label: 'Class', value: 'passengerClass' },
  { label: 'Embarkation port', value: 'embarked' },
];

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0,
});

function average(values: number[]) {
  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeNumber(value: number | string) {
  if (value === '') {
    return null;
  }

  return typeof value === 'number' ? value : Number(value);
}

function normalizeEmbarkation(code: string): Embarkation {
  switch (code) {
    case 'C':
      return 'Cherbourg';
    case 'Q':
      return 'Queenstown';
    case 'S':
      return 'Southampton';
    default:
      return 'Unknown';
  }
}

function classLabel(passengerClass: TitanicPassenger['passengerClass']) {
  return `${passengerClass}${passengerClass === 1 ? 'st' : passengerClass === 2 ? 'nd' : 'rd'} class`;
}

function chartDimensionLabel(chartDimension: ChartDimension) {
  switch (chartDimension) {
    case 'sex':
      return 'sex';
    case 'passengerClass':
      return 'class';
    case 'embarked':
      return 'embarkation port';
    default:
      return 'group';
  }
}

function chartSegmentLabel(
  chartDimension: ChartDimension,
  value: TitanicPassenger['sex'] | TitanicPassenger['passengerClass'] | Embarkation,
) {
  switch (chartDimension) {
    case 'sex':
      return value === 'female' ? 'Women' : 'Men';
    case 'passengerClass':
      return classLabel(value as TitanicPassenger['passengerClass']);
    case 'embarked':
      return value as Embarkation;
    default:
      return String(value);
  }
}

function buildSurvivalSegments(
  passengers: TitanicPassenger[],
  chartDimension: ChartDimension,
): SurvivalSegment[] {
  if (chartDimension === 'sex') {
    return (['female', 'male'] as const).map((sex) => {
      const cohort = passengers.filter((passenger) => passenger.sex === sex);
      const survivedCount = cohort.filter((passenger) => passenger.survived).length;

      return {
        key: sex,
        label: chartSegmentLabel(chartDimension, sex),
        count: cohort.length,
        survivedCount,
        survivalRate: cohort.length ? survivedCount / cohort.length : 0,
      };
    });
  }

  if (chartDimension === 'passengerClass') {
    return ([1, 2, 3] as const).map((passengerClass) => {
      const cohort = passengers.filter(
        (passenger) => passenger.passengerClass === passengerClass,
      );
      const survivedCount = cohort.filter((passenger) => passenger.survived).length;

      return {
        key: String(passengerClass),
        label: chartSegmentLabel(chartDimension, passengerClass),
        count: cohort.length,
        survivedCount,
        survivalRate: cohort.length ? survivedCount / cohort.length : 0,
      };
    });
  }

  return (
    ['Cherbourg', 'Queenstown', 'Southampton', 'Unknown'] as const
  ).map((embarked) => {
    const cohort = passengers.filter((passenger) => passenger.embarked === embarked);
    const survivedCount = cohort.filter((passenger) => passenger.survived).length;

    return {
      key: embarked,
      label: chartSegmentLabel(chartDimension, embarked),
      count: cohort.length,
      survivedCount,
      survivalRate: cohort.length ? survivedCount / cohort.length : 0,
    };
  });
}

function formatAverage(value: number | null, kind: 'age' | 'fare') {
  if (value === null) {
    return 'Unknown';
  }

  return kind === 'fare'
    ? currencyFormatter.format(value)
    : numberFormatter.format(value);
}

function segmentColor(chartDimension: ChartDimension, segmentKey: string) {
  if (chartDimension === 'sex') {
    return segmentKey === 'female'
      ? 'var(--analytics-chart-female)'
      : 'var(--analytics-chart-male)';
  }

  if (chartDimension === 'passengerClass') {
    switch (segmentKey) {
      case '1':
        return 'var(--analytics-chart-class-1)';
      case '2':
        return 'var(--analytics-chart-class-2)';
      default:
        return 'var(--analytics-chart-class-3)';
    }
  }

  switch (segmentKey) {
    case 'Cherbourg':
      return 'var(--analytics-chart-port-c)';
    case 'Queenstown':
      return 'var(--analytics-chart-port-q)';
    case 'Southampton':
      return 'var(--analytics-chart-port-s)';
    default:
      return 'var(--analytics-chart-unknown)';
  }
}

function SurvivalBarPlot({
  segments,
  chartDimension,
}: {
  segments: SurvivalSegment[];
  chartDimension: ChartDimension;
}) {
  const leftPadding = 150;
  const plotWidth = 320;
  const rightPadding = 78;
  const topPadding = 30;
  const rowHeight = 50;
  const barHeight = 16;
  const chartHeight = topPadding + segments.length * rowHeight + 8;
  const chartWidth = leftPadding + plotWidth + rightPadding;
  const ticks = [0, 0.5, 1];

  return (
    <div className="analytics-app__plot-shell">
      <svg
        className="analytics-app__plot"
        role="img"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        aria-label="Bar plot showing survival rate by segment"
      >
        {ticks.map((tick) => {
          const x = leftPadding + tick * plotWidth;

          return (
            <g key={tick}>
              <line
                x1={x}
                x2={x}
                y1={topPadding - 12}
                y2={chartHeight - 10}
                stroke="var(--analytics-border)"
                strokeDasharray={tick === 0 ? undefined : '4 6'}
              />
              <text
                x={x}
                y={18}
                fill="var(--analytics-muted)"
                fontSize="12"
                textAnchor={tick === 0 ? 'start' : tick === 1 ? 'end' : 'middle'}
              >
                {percentFormatter.format(tick)}
              </text>
            </g>
          );
        })}

        {segments.map((segment, index) => {
          const y = topPadding + index * rowHeight;
          const barWidth = plotWidth * segment.survivalRate;
          const fill = segmentColor(chartDimension, segment.key);

          return (
            <g key={segment.key}>
              <text
                x={0}
                y={y + 7}
                fill="var(--analytics-heading)"
                fontSize="12"
                fontWeight="700"
              >
                {segment.label}
              </text>
              <text
                x={0}
                y={y + 21}
                fill="var(--analytics-muted)"
                fontSize="11"
              >
                {segment.count} passengers
              </text>

              <rect
                x={leftPadding}
                y={y - barHeight / 2}
                width={plotWidth}
                height={barHeight}
                rx={barHeight / 2}
                fill="var(--analytics-app-bg)"
                stroke="var(--analytics-border)"
              />
              <rect
                x={leftPadding}
                y={y - barHeight / 2}
                width={barWidth}
                height={barHeight}
                rx={barHeight / 2}
                fill={fill}
              />

              <text
                x={leftPadding + plotWidth + 12}
                y={y + 1}
                fill="var(--analytics-heading)"
                fontSize="12"
                fontWeight="700"
              >
                {segment.count > 0
                  ? percentFormatter.format(segment.survivalRate)
                  : '—'}
              </text>
              <text
                x={leftPadding + plotWidth + 12}
                y={y + 16}
                fill="var(--analytics-muted)"
                fontSize="11"
              >
                {segment.survivedCount}/{segment.count}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="analytics-app__plot-caption">
        Each bar shows the share of passengers in that group who survived.
      </p>
    </div>
  );
}

export default function App() {
  const passengers = useMemo<TitanicPassenger[]>(
    () =>
      titanicData.map((passenger, index) => ({
        id: `${index + 1}`,
        age: normalizeNumber(passenger.age),
        sex: passenger.sex === 'female' ? 'female' : 'male',
        passengerClass:
          passenger.pclass === 1 || passenger.pclass === 2 ? passenger.pclass : 3,
        fare: normalizeNumber(passenger.fare),
        embarked: normalizeEmbarkation(passenger.embarked),
        survived: passenger.survived === 1,
      })),
    [],
  );
  const [selectedClass, setSelectedClass] = useState<ClassFilter>('all');
  const [selectedEmbarkation, setSelectedEmbarkation] =
    useState<EmbarkationFilter>('all');
  const [chartDimension, setChartDimension] = useState<ChartDimension>('sex');

  const filteredPassengers = useMemo(() => {
    return passengers.filter((passenger) => {
      if (
        selectedClass !== 'all' &&
        passenger.passengerClass !== selectedClass
      ) {
        return false;
      }

      if (
        selectedEmbarkation !== 'all' &&
        passenger.embarked !== selectedEmbarkation
      ) {
        return false;
      }

      return true;
    });
  }, [passengers, selectedClass, selectedEmbarkation]);

  const metrics = useMemo(() => {
    const survivedCount = filteredPassengers.filter(
      (passenger) => passenger.survived,
    ).length;

    return {
      totalPassengers: filteredPassengers.length,
      survivalRate:
        filteredPassengers.length > 0
          ? survivedCount / filteredPassengers.length
          : null,
      averageAge: average(
        filteredPassengers
          .map((passenger) => passenger.age)
          .filter((age): age is number => age !== null),
      ),
      averageFare: average(
        filteredPassengers
          .map((passenger) => passenger.fare)
          .filter((fare): fare is number => fare !== null),
      ),
      survivedCount,
    };
  }, [filteredPassengers]);

  const survivalSegments = useMemo(
    () => buildSurvivalSegments(filteredPassengers, chartDimension),
    [filteredPassengers, chartDimension],
  );

  const activeFilterCount = [
    selectedClass !== 'all',
    selectedEmbarkation !== 'all',
  ].filter(Boolean).length;

  function clearFilters() {
    setSelectedClass('all');
    setSelectedEmbarkation('all');
  }

  return (
    <div className="analytics-app">
      <header className="analytics-app__panel analytics-app__hero">
        <div>
          <div className="analytics-app__eyebrow">Titanic Explorer</div>
          <h1 className="analytics-app__title">Passenger survival patterns</h1>
          <p className="analytics-app__summary">
            Compare survival outcomes with a simple bar plots.
          </p>
        </div>

        <span className="analytics-app__status analytics-app__status--ready">
          Example MFE App
        </span>
      </header>

      <section className="analytics-app__kpi-grid">
        <article className="analytics-app__panel analytics-app__kpi">
          <span className="analytics-app__kpi-label">Passengers in view</span>
          <strong className="analytics-app__kpi-value">{metrics.totalPassengers}</strong>
          <p className="analytics-app__kpi-meta">
            {passengers.length} passengers available in the sample
          </p>
        </article>

        <article className="analytics-app__panel analytics-app__kpi">
          <span className="analytics-app__kpi-label">Survival rate</span>
          <strong className="analytics-app__kpi-value">
            {metrics.survivalRate !== null
              ? percentFormatter.format(metrics.survivalRate)
              : '—'}
          </strong>
          <p className="analytics-app__kpi-meta">
            {metrics.survivedCount} survivors in the current view
          </p>
        </article>

        <article className="analytics-app__panel analytics-app__kpi">
          <span className="analytics-app__kpi-label">Average age</span>
          <strong className="analytics-app__kpi-value">
            {formatAverage(metrics.averageAge, 'age')}
          </strong>
          <p className="analytics-app__kpi-meta">Unknown ages are excluded</p>
        </article>

        <article className="analytics-app__panel analytics-app__kpi">
          <span className="analytics-app__kpi-label">Average fare</span>
          <strong className="analytics-app__kpi-value">
            {formatAverage(metrics.averageFare, 'fare')}
          </strong>
          <p className="analytics-app__kpi-meta">Unknown fares are excluded</p>
        </article>
      </section>

      <section className="analytics-app__workspace">
        <div className="analytics-app__panel analytics-app__main-panel">
          <div className="analytics-app__section-header">
            <div>
              <h2 className="analytics-app__section-title">Survival comparison</h2>
              <p className="analytics-app__section-copy">
                Switch the grouping and compare the outcome for each segment at a
                glance.
              </p>
            </div>
            <div className="analytics-app__section-meta">
              <span>
                Showing {filteredPassengers.length} of {passengers.length}
              </span>
              {activeFilterCount > 0 ? (
                <button
                  className="analytics-app__button analytics-app__button--ghost"
                  onClick={clearFilters}
                  type="button"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          <div className="analytics-app__filters">
            <label className="analytics-app__field">
              <span className="analytics-app__field-label">View survival by</span>
              <select
                className="analytics-app__select"
                onChange={(event) =>
                  setChartDimension(event.target.value as ChartDimension)
                }
                value={chartDimension}
              >
                {chartDimensionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="analytics-app__field">
              <span className="analytics-app__field-label">Filter class</span>
              <select
                className="analytics-app__select"
                onChange={(event) =>
                  setSelectedClass(
                    event.target.value === 'all'
                      ? 'all'
                      : Number(event.target.value) as TitanicPassenger['passengerClass'],
                  )
                }
                value={selectedClass}
              >
                {classOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All classes' : classLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="analytics-app__field">
              <span className="analytics-app__field-label">Embarked</span>
              <select
                className="analytics-app__select"
                onChange={(event) =>
                  setSelectedEmbarkation(event.target.value as EmbarkationFilter)
                }
                value={selectedEmbarkation}
              >
                {embarkationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All ports' : option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filteredPassengers.length === 0 ? (
            <div className="analytics-app__state-card">
              <h3 className="analytics-app__state-title">
                No passengers match the current filters
              </h3>
              <p className="analytics-app__state-copy">
                Reset the filters to bring the full sample back into view.
              </p>
              <button
                className="analytics-app__button analytics-app__button--primary"
                onClick={clearFilters}
                type="button"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="analytics-app__chart-card">
              <div className="analytics-app__chart-header">
                <div>
                  <h3 className="analytics-app__insight-title">
                    Survival by {chartDimensionLabel(chartDimension)}
                  </h3>
                  <p className="analytics-app__insight-copy">
                    Built directly in React from <code>src/data/titanic.json</code>.
                  </p>
                </div>
              </div>

              <SurvivalBarPlot
                chartDimension={chartDimension}
                segments={survivalSegments}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
