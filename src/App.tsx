import { useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  titanicPassengers,
  type Embarkation,
  type TitanicPassenger,
} from './titanicData';

type DataState = 'loading' | 'ready';
type ClassFilter = 'all' | TitanicPassenger['passengerClass'];
type OutcomeFilter = 'all' | 'survived' | 'perished';
type SortOption = 'fare-desc' | 'fare-asc' | 'age-asc' | 'name-asc';

const classOptions: ClassFilter[] = ['all', 1, 2, 3];
const embarkationOptions: Array<'all' | Embarkation> = [
  'all',
  'Cherbourg',
  'Queenstown',
  'Southampton',
];

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
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

function survivalLabel(survived: boolean) {
  return survived ? 'Survived' : 'Perished';
}

export default function App() {
  const [passengers, setPassengers] = useState<TitanicPassenger[]>([]);
  const [dataState, setDataState] = useState<DataState>('loading');
  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassFilter>('all');
  const [selectedOutcome, setSelectedOutcome] =
    useState<OutcomeFilter>('all');
  const [selectedEmbarkation, setSelectedEmbarkation] =
    useState<'all' | Embarkation>('all');
  const [sortBy, setSortBy] = useState<SortOption>('fare-desc');
  const [selectedPassengerId, setSelectedPassengerId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPassengers(titanicPassengers);
      setDataState('ready');
    }, 280);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredPassengers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const nextPassengers = passengers
      .filter((passenger) => {
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
          selectedOutcome === 'survived' &&
          !passenger.survived
        ) {
          return false;
        }

        if (
          selectedOutcome === 'perished' &&
          passenger.survived
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
      })
      .sort((left, right) => {
        switch (sortBy) {
          case 'fare-asc':
            return left.fare - right.fare;
          case 'age-asc':
            return (left.age ?? Number.MAX_SAFE_INTEGER) - (right.age ?? Number.MAX_SAFE_INTEGER);
          case 'name-asc':
            return left.name.localeCompare(right.name);
          case 'fare-desc':
          default:
            return right.fare - left.fare;
        }
      });

    return nextPassengers;
  }, [passengers, query, selectedClass, selectedOutcome, selectedEmbarkation, sortBy]);

  const resolvedSelectedPassengerId =
    selectedPassengerId &&
    filteredPassengers.some((passenger) => passenger.id === selectedPassengerId)
      ? selectedPassengerId
      : filteredPassengers[0]?.id ?? null;

  const selectedPassenger =
    filteredPassengers.find(
      (passenger) => passenger.id === resolvedSelectedPassengerId,
    ) ?? null;

  const metrics = useMemo(() => {
    const survivedCount = filteredPassengers.filter(
      (passenger) => passenger.survived,
    ).length;
    const avgAge = average(
      filteredPassengers
        .map((passenger) => passenger.age)
        .filter((age): age is number => age !== null),
    );
    const avgFare = average(filteredPassengers.map((passenger) => passenger.fare));
    const childrenCount = filteredPassengers.filter(
      (passenger) => passenger.age !== null && passenger.age < 18,
    ).length;

    return {
      totalPassengers: filteredPassengers.length,
      survivalRate:
        filteredPassengers.length > 0
          ? survivedCount / filteredPassengers.length
          : null,
      avgAge,
      avgFare,
      childrenCount,
    };
  }, [filteredPassengers]);

  const classMix = useMemo(
    () =>
      [1, 2, 3].map((passengerClass) => {
        const count = filteredPassengers.filter(
          (passenger) => passenger.passengerClass === passengerClass,
        ).length;

        return {
          passengerClass: passengerClass as TitanicPassenger['passengerClass'],
          count,
          ratio: filteredPassengers.length ? count / filteredPassengers.length : 0,
        };
      }),
    [filteredPassengers],
  );

  const selectedClassCohort = useMemo(() => {
    if (!selectedPassenger) {
      return null;
    }

    const cohort = passengers.filter(
      (passenger) =>
        passenger.passengerClass === selectedPassenger.passengerClass,
    );
    const survivors = cohort.filter((passenger) => passenger.survived).length;

    return {
      cohortSize: cohort.length,
      survivalRate: cohort.length ? survivors / cohort.length : 0,
    };
  }, [passengers, selectedPassenger]);

  const activeFilterCount = [
    query.trim().length > 0,
    selectedClass !== 'all',
    selectedOutcome !== 'all',
    selectedEmbarkation !== 'all',
  ].filter(Boolean).length;

  const totalPassengers = passengers.length;

  function clearFilters() {
    setQuery('');
    setSelectedClass('all');
    setSelectedOutcome('all');
    setSelectedEmbarkation('all');
    setSortBy('fare-desc');
  }

  return (
    <div className="analytics-app">
      <header className="analytics-app__panel analytics-app__hero">
        <div>
          <div className="analytics-app__eyebrow">Titanic Explorer</div>
          <h1 className="analytics-app__title">Passenger survival</h1>
          <p className="analytics-app__summary">
            Inspect who survived the Titanic, comparing passenger cohorts, scanning
            the manifest, and drilling into a single traveler.
          </p>
        </div>

        <span className={`analytics-app__status analytics-app__status--${dataState}`}>
          {dataState === 'loading' ? 'Loading sample feed' : 'Sample feed ready'}
        </span>
      </header>

      <section className="analytics-app__kpi-grid" aria-label="Key metrics">
        <article className="analytics-app__panel analytics-app__kpi">
          <span className="analytics-app__kpi-label">Passengers in view</span>
          <strong className="analytics-app__kpi-value">
            {dataState === 'ready' ? metrics.totalPassengers : '—'}
          </strong>
          <p className="analytics-app__kpi-meta">
            {dataState === 'ready'
              ? `${totalPassengers} passengers in the curated sample`
              : 'Waiting for sample data'}
          </p>
        </article>
        <article className="analytics-app__panel analytics-app__kpi">
          <span className="analytics-app__kpi-label">Survival rate</span>
          <strong className="analytics-app__kpi-value">
            {dataState === 'ready' && metrics.survivalRate !== null
              ? `${Math.round(metrics.survivalRate * 100)}%`
              : '—'}
          </strong>
          <p className="analytics-app__kpi-meta">
            {dataState === 'ready'
              ? 'Calculated from the filtered cohort'
              : 'Unavailable until the feed resolves'}
          </p>
        </article>
        <article className="analytics-app__panel analytics-app__kpi">
          <span className="analytics-app__kpi-label">Average fare</span>
          <strong className="analytics-app__kpi-value">
            {dataState === 'ready' && metrics.avgFare !== null
              ? currencyFormatter.format(metrics.avgFare)
              : '—'}
          </strong>
          <p className="analytics-app__kpi-meta">
            {dataState === 'ready'
              ? 'Useful for comparing cabin-class mix'
              : 'Waiting for ticket data'}
          </p>
        </article>
        <article className="analytics-app__panel analytics-app__kpi">
          <span className="analytics-app__kpi-label">Children in view</span>
          <strong className="analytics-app__kpi-value">
            {dataState === 'ready' ? metrics.childrenCount : '—'}
          </strong>
          <p className="analytics-app__kpi-meta">
            {dataState === 'ready'
              ? `Average age ${metrics.avgAge !== null ? numberFormatter.format(metrics.avgAge) : 'unknown'}`
              : 'Age data still loading'}
          </p>
        </article>
      </section>

      <section className="analytics-app__workspace">
        <div className="analytics-app__panel analytics-app__main-panel">
          <div className="analytics-app__section-header">
            <div>
              <h2 className="analytics-app__section-title">Manifest view</h2>
              <p className="analytics-app__section-copy">
                Filter the sample manifest, sort the cohort, and select a
                passenger to inspect the story behind the row.
              </p>
            </div>
            <div className="analytics-app__section-meta">
              <span>{dataState === 'ready' ? `Showing ${filteredPassengers.length} of ${totalPassengers}` : 'Feed pending'}</span>
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
              <span className="analytics-app__field-label">Class</span>
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

            <div className="analytics-app__field">
              <span className="analytics-app__field-label">Outcome</span>
              <div className="analytics-app__segmented-control" role="group" aria-label="Passenger outcome">
                {(['all', 'survived', 'perished'] as OutcomeFilter[]).map((option) => (
                  <button
                    aria-pressed={selectedOutcome === option}
                    className={`analytics-app__segment ${selectedOutcome === option ? 'analytics-app__segment--active' : ''}`}
                    disabled={dataState !== 'ready'}
                    key={option}
                    onClick={() => setSelectedOutcome(option)}
                    type="button"
                  >
                    {option === 'all'
                      ? 'All'
                      : option === 'survived'
                        ? 'Survived'
                        : 'Perished'}
                  </button>
                ))}
              </div>
            </div>

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

            <label className="analytics-app__field">
              <span className="analytics-app__field-label">Sort</span>
              <select
                className="analytics-app__select"
                disabled={dataState !== 'ready'}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                value={sortBy}
              >
                <option value="fare-desc">Highest fare</option>
                <option value="fare-asc">Lowest fare</option>
                <option value="age-asc">Youngest first</option>
                <option value="name-asc">Name A-Z</option>
              </select>
            </label>
          </div>

          {dataState === 'loading' ? (
            <div className="analytics-app__state-card">
              <h3 className="analytics-app__state-title">Loading the manifest</h3>
              <p className="analytics-app__state-copy">
                Pulling the local sample and calculating cohort metrics.
              </p>
            </div>
          ) : null}

          {dataState === 'ready' && filteredPassengers.length === 0 ? (
            <div className="analytics-app__state-card">
              <h3 className="analytics-app__state-title">No passengers match the current filters</h3>
              <p className="analytics-app__state-copy">
                Reset the cohort filters to restore the full sample manifest.
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
            <div className="analytics-app__table-shell">
              <table className="analytics-app__table">
                <thead>
                  <tr>
                    <th scope="col">Passenger</th>
                    <th scope="col">Class</th>
                    <th scope="col">Age</th>
                    <th scope="col">Port</th>
                    <th scope="col">Fare</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPassengers.map((passenger) => {
                    const isSelected = passenger.id === selectedPassengerId;

                    return (
                      <tr
                        aria-selected={isSelected}
                        className={isSelected ? 'analytics-app__table-row analytics-app__table-row--selected' : 'analytics-app__table-row'}
                        key={passenger.id}
                        onClick={() => setSelectedPassengerId(passenger.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedPassengerId(passenger.id);
                          }
                        }}
                        tabIndex={0}
                      >
                        <td>
                          <div className="analytics-app__passenger-name">{passenger.name}</div>
                          <div className="analytics-app__passenger-meta">
                            {passenger.destination}
                          </div>
                        </td>
                        <td>{classLabel(passenger.passengerClass)}</td>
                        <td>{passenger.age ?? 'Unknown'}</td>
                        <td>{passenger.embarked}</td>
                        <td>{currencyFormatter.format(passenger.fare)}</td>
                        <td>
                          <span
                            className={`analytics-app__pill analytics-app__pill--${passenger.survived ? 'success' : 'danger'}`}
                          >
                            {survivalLabel(passenger.survived)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <aside className="analytics-app__panel analytics-app__side-panel">
          <div className="analytics-app__section-header analytics-app__section-header--stacked">
            <div>
              <h2 className="analytics-app__section-title">Selected passenger</h2>
              <p className="analytics-app__section-copy">
                Detail stays local to this view so the shell can keep global
                navigation and broader page context.
              </p>
            </div>
          </div>

          {dataState !== 'ready' || !selectedPassenger ? (
            <div className="analytics-app__state-card analytics-app__state-card--compact">
              <h3 className="analytics-app__state-title">
                {dataState === 'loading'
                  ? 'Preparing detail panel'
                  : 'Select a passenger'}
              </h3>
              <p className="analytics-app__state-copy">
                {dataState === 'loading'
                  ? 'Detail becomes available once the sample manifest finishes loading.'
                  : 'Pick a passenger from the table to inspect their cohort context.'}
              </p>
            </div>
          ) : (
            <>
              <div className="analytics-app__passenger-card">
                <div className="analytics-app__passenger-card-top">
                  <div>
                    <h3 className="analytics-app__passenger-card-title">
                      {selectedPassenger.name}
                    </h3>
                    <p className="analytics-app__passenger-card-subtitle">
                      {classLabel(selectedPassenger.passengerClass)} passenger to{' '}
                      {selectedPassenger.destination}
                    </p>
                  </div>
                  <span
                    className={`analytics-app__pill analytics-app__pill--${selectedPassenger.survived ? 'success' : 'danger'}`}
                  >
                    {survivalLabel(selectedPassenger.survived)}
                  </span>
                </div>

                <dl className="analytics-app__facts-grid">
                  <div>
                    <dt>Age</dt>
                    <dd>{selectedPassenger.age ?? 'Unknown'}</dd>
                  </div>
                  <div>
                    <dt>Port</dt>
                    <dd>{selectedPassenger.embarked}</dd>
                  </div>
                  <div>
                    <dt>Fare</dt>
                    <dd>{currencyFormatter.format(selectedPassenger.fare)}</dd>
                  </div>
                  <div>
                    <dt>Party size</dt>
                    <dd>{selectedPassenger.travelGroupSize}</dd>
                  </div>
                </dl>

                <p className="analytics-app__narrative">{selectedPassenger.notes}</p>
              </div>

              {selectedClassCohort ? (
                <div className="analytics-app__insight-card">
                  <h3 className="analytics-app__insight-title">Class cohort signal</h3>
                  <p className="analytics-app__insight-copy">
                    In this sample, {classLabel(selectedPassenger.passengerClass)} passengers
                    have a {Math.round(selectedClassCohort.survivalRate * 100)}%
                    survival rate across {selectedClassCohort.cohortSize} records.
                  </p>
                </div>
              ) : null}
            </>
          )}

          <div className="analytics-app__mix-card">
            <div className="analytics-app__mix-card-header">
              <h3 className="analytics-app__insight-title">Class mix in current view</h3>
              <span>{dataState === 'ready' ? `${filteredPassengers.length} passengers` : '—'}</span>
            </div>
            <div className="analytics-app__mix-list">
              {classMix.map((entry) => (
                <div className="analytics-app__mix-row" key={entry.passengerClass}>
                  <div className="analytics-app__mix-label">
                    <span>{classLabel(entry.passengerClass)}</span>
                    <span>{entry.count}</span>
                  </div>
                  <div className="analytics-app__mix-bar">
                    <span
                      className="analytics-app__mix-fill"
                      style={{ width: `${Math.max(entry.ratio * 100, entry.count > 0 ? 10 : 0)}%` }}
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
