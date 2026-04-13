import { useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  titanicPassengers,
  type Embarkation,
  type TitanicPassenger,
} from './titanicData';

type DataState = 'loading' | 'ready';
type ClassFilter = 'all' | TitanicPassenger['passengerClass'];
type ChartDimension = 'sex' | 'passengerClass' | 'embarked';

interface SurvivalSegment {
  key: string;
  label: string;
  count: number;
  survivedCount: number;
  survivalRate: number;
  averageAge: number | null;
  averageFare: number | null;
}

const classOptions: ClassFilter[] = ['all', 1, 2, 3];
const embarkationOptions: Array<'all' | Embarkation> = [
  'all',
  'Cherbourg',
  'Queenstown',
  'Southampton',
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
        averageAge: average(
          cohort
            .map((passenger) => passenger.age)
            .filter((age): age is number => age !== null),
        ),
        averageFare: average(cohort.map((passenger) => passenger.fare)),
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
        averageAge: average(
          cohort
            .map((passenger) => passenger.age)
            .filter((age): age is number => age !== null),
        ),
        averageFare: average(cohort.map((passenger) => passenger.fare)),
      };
    });
  }

  return (['Cherbourg', 'Queenstown', 'Southampton'] as const).map((embarked) => {
    const cohort = passengers.filter((passenger) => passenger.embarked === embarked);
    const survivedCount = cohort.filter((passenger) => passenger.survived).length;

    return {
      key: embarked,
      label: chartSegmentLabel(chartDimension, embarked),
      count: cohort.length,
      survivedCount,
      survivalRate: cohort.length ? survivedCount / cohort.length : 0,
      averageAge: average(
        cohort
          .map((passenger) => passenger.age)
          .filter((age): age is number => age !== null),
      ),
      averageFare: average(cohort.map((passenger) => passenger.fare)),
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

function chartFillSize(value: number, minimumPixels: number) {
  return `max(${(value * 100).toFixed(1)}%, ${minimumPixels}px)`;
}

export default function App() {
  const [passengers, setPassengers] = useState<TitanicPassenger[]>([]);
  const [dataState, setDataState] = useState<DataState>('loading');
  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassFilter>('all');
  const [selectedEmbarkation, setSelectedEmbarkation] =
    useState<'all' | Embarkation>('all');
  const [chartDimension, setChartDimension] = useState<ChartDimension>('sex');
  const [selectedSegmentKey, setSelectedSegmentKey] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPassengers(titanicPassengers);
      setDataState('ready');
    }, 280);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredPassengers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return passengers.filter((passenger) => {
      if (
        normalizedQuery &&
        !`${passenger.name} ${passenger.destination}`
          .toLowerCase()
          .includes(normalizedQuery)
      ) {
        return false;
      }

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
  }, [passengers, query, selectedClass, selectedEmbarkation]);

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
      averageFare: average(filteredPassengers.map((passenger) => passenger.fare)),
      survivedCount,
    };
  }, [filteredPassengers]);

  const survivalSegments = useMemo(
    () => buildSurvivalSegments(filteredPassengers, chartDimension),
    [filteredPassengers, chartDimension],
  );

  const resolvedSelectedSegmentKey =
    selectedSegmentKey &&
    survivalSegments.some((segment) => segment.key === selectedSegmentKey)
      ? selectedSegmentKey
      : survivalSegments.find((segment) => segment.count > 0)?.key ??
        survivalSegments[0]?.key ??
        null;

  const selectedSegment =
    survivalSegments.find((segment) => segment.key === resolvedSelectedSegmentKey) ??
    null;

  const bestAndWorstSegments = useMemo(() => {
    const populatedSegments = survivalSegments.filter((segment) => segment.count > 0);

    if (populatedSegments.length < 2) {
      return null;
    }

    const sortedSegments = [...populatedSegments].sort(
      (left, right) => right.survivalRate - left.survivalRate,
    );

    return {
      best: sortedSegments[0],
      worst: sortedSegments[sortedSegments.length - 1],
    };
  }, [survivalSegments]);

  const activeFilterCount = [
    query.trim().length > 0,
    selectedClass !== 'all',
    selectedEmbarkation !== 'all',
  ].filter(Boolean).length;

  const totalPassengers = passengers.length;

  function clearFilters() {
    setQuery('');
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
            Explore the Titanic sample with a survival chart, switch between
            variables like sex and class, and inspect the values behind each
            cohort.
          </p>
        </div>

        <span className={`analytics-app__status analytics-app__status--${dataState}`}>
          {dataState === 'loading' ? 'Loading sample feed' : 'Sample data only'}
        </span>
      </header>

      <section className="analytics-app__kpi-grid">
        <article className="analytics-app__panel analytics-app__kpi">
          <span className="analytics-app__kpi-label">Passengers in view</span>
          <strong className="analytics-app__kpi-value">
            {dataState === 'ready' ? metrics.totalPassengers : '—'}
          </strong>
          <p className="analytics-app__kpi-meta">
            {dataState === 'ready'
              ? `${totalPassengers} passengers available in the sample`
              : 'Waiting for the sample manifest'}
          </p>
        </article>

        <article className="analytics-app__panel analytics-app__kpi">
          <span className="analytics-app__kpi-label">Survival rate</span>
          <strong className="analytics-app__kpi-value">
            {dataState === 'ready' && metrics.survivalRate !== null
              ? percentFormatter.format(metrics.survivalRate)
              : '—'}
          </strong>
          <p className="analytics-app__kpi-meta">
            {dataState === 'ready'
              ? `${metrics.survivedCount} survivors in the current cohort`
              : 'Calculating cohort outcome'}
          </p>
        </article>

        <article className="analytics-app__panel analytics-app__kpi">
          <span className="analytics-app__kpi-label">Average age</span>
          <strong className="analytics-app__kpi-value">
            {dataState === 'ready' ? formatAverage(metrics.averageAge, 'age') : '—'}
          </strong>
          <p className="analytics-app__kpi-meta">Unknown ages are excluded</p>
        </article>

        <article className="analytics-app__panel analytics-app__kpi">
          <span className="analytics-app__kpi-label">Average fare</span>
          <strong className="analytics-app__kpi-value">
            {dataState === 'ready' ? formatAverage(metrics.averageFare, 'fare') : '—'}
          </strong>
          <p className="analytics-app__kpi-meta">Average ticket price in view</p>
        </article>
      </section>

      <section className="analytics-app__workspace">
        <div className="analytics-app__panel analytics-app__main-panel">
          <div className="analytics-app__section-header">
            <div>
              <h2 className="analytics-app__section-title">Survival comparison</h2>
              <p className="analytics-app__section-copy">
                Pick the variable to compare and click a bar to inspect that cohort.
              </p>
            </div>
            <div className="analytics-app__section-meta">
              <span>
                {dataState === 'ready'
                  ? `Showing ${filteredPassengers.length} of ${totalPassengers}`
                  : 'Feed pending'}
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
              <span className="analytics-app__field-label">Search</span>
              <input
                className="analytics-app__input"
                disabled={dataState !== 'ready'}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search passenger or destination"
                type="search"
                value={query}
              />
            </label>

            <label className="analytics-app__field">
              <span className="analytics-app__field-label">View survival by</span>
              <select
                className="analytics-app__select"
                disabled={dataState !== 'ready'}
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
                disabled={dataState !== 'ready'}
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
                disabled={dataState !== 'ready'}
                onChange={(event) =>
                  setSelectedEmbarkation(
                    event.target.value as 'all' | Embarkation,
                  )
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

          {dataState === 'loading' ? (
            <div className="analytics-app__state-card">
              <h3 className="analytics-app__state-title">Loading the manifest</h3>
              <p className="analytics-app__state-copy">
                Pulling the local sample and preparing survival cohorts.
              </p>
            </div>
          ) : null}

          {dataState === 'ready' && filteredPassengers.length === 0 ? (
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
          ) : null}

          {dataState === 'ready' && filteredPassengers.length > 0 ? (
            <>
              <div className="analytics-app__chart-card">
                <div className="analytics-app__chart-header">
                  <div>
                    <h3 className="analytics-app__insight-title">
                      Survival by {chartDimensionLabel(chartDimension)}
                    </h3>
                    <p className="analytics-app__insight-copy">
                      Bar height shows the share of passengers in each group who
                      survived.
                    </p>
                  </div>
                  {selectedSegment ? (
                    <span className="analytics-app__status analytics-app__status--ready">
                      {selectedSegment.label}
                    </span>
                  ) : null}
                </div>

                <div className="analytics-app__chart">
                  <div className="analytics-app__chart-gridlines" aria-hidden="true">
                    {[0, 25, 50, 75, 100].map((tick) => (
                      <div
                        className="analytics-app__chart-gridline"
                        key={tick}
                        style={{ bottom: `${tick}%` }}
                      >
                        <span>{tick}%</span>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`analytics-app__chart-bars analytics-app__chart-bars--${survivalSegments.length}`}
                  >
                    {survivalSegments.map((segment) => {
                      const isSelected = segment.key === resolvedSelectedSegmentKey;
                      const barHeight =
                        segment.count > 0
                          ? chartFillSize(segment.survivalRate, 24)
                          : '10px';

                      return (
                        <button
                          aria-pressed={isSelected}
                          className={`analytics-app__chart-column${isSelected ? ' analytics-app__chart-column--selected' : ''}`}
                          key={segment.key}
                          onClick={() => setSelectedSegmentKey(segment.key)}
                          type="button"
                        >
                          <span className="analytics-app__chart-value">
                            {segment.count > 0
                              ? percentFormatter.format(segment.survivalRate)
                              : '—'}
                          </span>
                          <div className="analytics-app__chart-bar-shell">
                            <span className="analytics-app__chart-bar-caption">
                              {segment.survivedCount} of {segment.count}
                            </span>
                            <div
                              className={`analytics-app__chart-bar${segment.count === 0 ? ' analytics-app__chart-bar--empty' : ''}`}
                              style={{
                                height: barHeight,
                              }}
                            />
                          </div>
                          <span className="analytics-app__chart-label">
                            {segment.label}
                          </span>
                          <span className="analytics-app__chart-meta">
                            {segment.count} passengers
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div
                className={`analytics-app__readout-grid analytics-app__readout-grid--${survivalSegments.length}`}
              >
                {survivalSegments.map((segment) => {
                  const isSelected = segment.key === resolvedSelectedSegmentKey;

                  return (
                    <button
                      className={`analytics-app__readout-card${isSelected ? ' analytics-app__readout-card--selected' : ''}`}
                      key={segment.key}
                      onClick={() => setSelectedSegmentKey(segment.key)}
                      type="button"
                    >
                      <span className="analytics-app__readout-label">{segment.label}</span>
                      <strong className="analytics-app__readout-value">
                        {segment.count > 0
                          ? percentFormatter.format(segment.survivalRate)
                          : '—'}
                      </strong>
                      <span className="analytics-app__readout-meta">
                        {segment.survivedCount} survived of {segment.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        <aside className="analytics-app__panel analytics-app__side-panel">
          <div className="analytics-app__section-header analytics-app__section-header--stacked">
            <div>
              <h2 className="analytics-app__section-title">Selected cohort</h2>
              <p className="analytics-app__section-copy">
                The value boxes update from the highlighted chart group.
              </p>
            </div>
          </div>

          {dataState !== 'ready' || !selectedSegment || selectedSegment.count === 0 ? (
            <div className="analytics-app__state-card analytics-app__state-card--compact">
              <h3 className="analytics-app__state-title">
                {dataState === 'loading' ? 'Preparing chart detail' : 'Select a group'}
              </h3>
              <p className="analytics-app__state-copy">
                {dataState === 'loading'
                  ? 'The detail panel appears once the sample manifest finishes loading.'
                  : 'Pick a bar to inspect survival values for that cohort.'}
              </p>
            </div>
          ) : (
            <>
              <div className="analytics-app__passenger-card">
                <div className="analytics-app__passenger-card-top">
                  <div>
                    <h3 className="analytics-app__passenger-card-title">
                      {selectedSegment.label}
                    </h3>
                    <p className="analytics-app__passenger-card-subtitle">
                      Survival grouped by {chartDimensionLabel(chartDimension)}
                    </p>
                  </div>
                  <span className="analytics-app__pill analytics-app__pill--success">
                    {percentFormatter.format(selectedSegment.survivalRate)}
                  </span>
                </div>

                <dl className="analytics-app__facts-grid">
                  <div>
                    <dt>Passengers</dt>
                    <dd>{selectedSegment.count}</dd>
                  </div>
                  <div>
                    <dt>Survived</dt>
                    <dd>{selectedSegment.survivedCount}</dd>
                  </div>
                  <div>
                    <dt>Average age</dt>
                    <dd>{formatAverage(selectedSegment.averageAge, 'age')}</dd>
                  </div>
                  <div>
                    <dt>Average fare</dt>
                    <dd>{formatAverage(selectedSegment.averageFare, 'fare')}</dd>
                  </div>
                </dl>

                <p className="analytics-app__narrative">
                  {selectedSegment.label} represents{' '}
                  {percentFormatter.format(
                    selectedSegment.count / filteredPassengers.length,
                  )}{' '}
                  of the filtered cohort and sits{' '}
                  {selectedSegment.survivalRate >= (metrics.survivalRate ?? 0)
                    ? 'above'
                    : 'below'}{' '}
                  the overall survival rate in view.
                </p>
              </div>

              {bestAndWorstSegments ? (
                <div className="analytics-app__insight-card">
                  <h3 className="analytics-app__insight-title">Survival signal</h3>
                  <p className="analytics-app__insight-copy">
                    {bestAndWorstSegments.best.label} has the strongest outcome at{' '}
                    {percentFormatter.format(bestAndWorstSegments.best.survivalRate)},
                    while {bestAndWorstSegments.worst.label} trails at{' '}
                    {percentFormatter.format(bestAndWorstSegments.worst.survivalRate)}.
                  </p>
                </div>
              ) : null}
            </>
          )}

          <div className="analytics-app__mix-card">
            <div className="analytics-app__mix-card-header">
              <h3 className="analytics-app__insight-title">Current breakdown</h3>
              <span>
                {dataState === 'ready'
                  ? `By ${chartDimensionLabel(chartDimension)}`
                  : '—'}
              </span>
            </div>
            <div className="analytics-app__mix-list">
              {survivalSegments.map((segment) => (
                <div className="analytics-app__mix-row" key={segment.key}>
                  <div className="analytics-app__mix-label">
                    <span>{segment.label}</span>
                    <span>
                      {segment.count > 0
                        ? percentFormatter.format(segment.survivalRate)
                        : '—'}
                    </span>
                  </div>
                  <div className="analytics-app__mix-bar">
                    <span
                      className="analytics-app__mix-fill"
                      style={{
                        width:
                          segment.count > 0
                            ? chartFillSize(segment.survivalRate, 24)
                            : '0px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
