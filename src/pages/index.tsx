import type { NextPage } from "next";
import styles from "../utils/styles/Home.module.css";
import pageStyles from "../utils/styles/Page.module.css";
import entryStyles from "../utils/styles/Entry.module.css";
import config from "../config.json";
import { useState, useEffect } from "react";
import { CgTrashEmpty } from "react-icons/cg";
import Image from "next/image";
import { Entry, Signin } from "../utils/types";
import { addZeroToTime } from "../utils/functions";

interface ApiResponse {
  error?: string;
  entries: Entry[];
  onlySignins: boolean;
  savedEntry: Entry;
}

const headers = {
  "Content-Type": "application/json",
  authorization: process.env.AUTHORIZATION || "",
};

const Home: NextPage = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [signin, setSignin] = useState<Entry | null>(null);
  const [signins, setSignins] = useState<Signin[]>([]);
  const [ownEntries, setOwnEntries] = useState<string[]>([]);
  const [createEntry, setCreateEntry] = useState(false);
  const [onlySignins, setOnlySignins] = useState(false);
  const [invalidMessage, setInvalidMessage] = useState<string | null>(null);

  const fetchData = async (filter: string | null, checkStorage: boolean) => {
    const res = await fetch("/api/entries", {
      method: "POST",
      headers,
      body: JSON.stringify({ filter, ownEntries, signins }),
    });
    const json: ApiResponse = await res.json();
    if (json?.error) return console.log(json.error);

    if (checkStorage) {
      const storageOwnEntries = localStorage.getItem("ownEntries");
      const storageSignins = localStorage.getItem("signins");

      if (storageOwnEntries) {
        const actualOwnEntries = JSON.parse(storageOwnEntries).filter(
          (id: string) => json.entries.some(({ _id }) => _id === id)
        );
        if (JSON.parse(storageOwnEntries).length !== actualOwnEntries.length) {
          localStorage.setItem("ownEntries", JSON.stringify(actualOwnEntries));
          setOwnEntries(actualOwnEntries);
        }
      }

      if (storageSignins) {
        const actualSignins = JSON.parse(storageSignins).filter(
          (signin: Signin) => json.entries.some(({ _id }) => _id === signin._id)
        );
        if (JSON.parse(storageSignins).length !== actualSignins.length) {
          localStorage.setItem("signins", JSON.stringify(actualSignins));
          setSignins(actualSignins);
        }
      }
    }

    setOnlySignins(json.onlySignins);
    setEntries(json.entries);
  };

  useEffect(() => {
    const storageEntries = localStorage.getItem("ownEntries");
    if (storageEntries) setOwnEntries(JSON.parse(storageEntries));

    const storageSignins = localStorage.getItem("signins");
    if (storageSignins) setSignins(JSON.parse(storageSignins));

    fetchData(null, true);
  }, []);

  const currentDateTime = () => {
    const today = new Date();
    const dd = addZeroToTime(today.getDate());
    const mm = addZeroToTime(today.getMonth() + 1);
    const yyyy = today.getFullYear();
    const hr = addZeroToTime(today.getHours());
    const min = addZeroToTime(today.getMinutes());

    return `${yyyy}-${mm}-${dd}T${hr}:${min}`;
  };

  const entriesHTML = (entries: Entry[], own: boolean) => {
    return entries.map((entry: Entry) => {
      const isSignedIn = signins.find(({ _id }) => _id === entry._id);

      return (
        <div className={entryStyles.entry} key={entry._id}>
          {own && (
            <CgTrashEmpty
              className={entryStyles.trashCan}
              size={29}
              onClick={(e: React.MouseEvent) => handleEntry(e, false, entry)}
            />
          )}
          <a
            className={entryStyles.teamsLink}
            href={config.TEAMS_CHAT_LINK.replace(
              "$USERNAME",
              entry.WindowsUsername
            )}
            rel="noopener noreferrer"
            target="_blank"
          >
            {entry.Name}
          </a>
          <p></p>
          <a
            className={entryStyles.route}
            href={entry.Route}
            rel="noopener noreferrer"
            target="_blank"
          >
            Route ({entry.Location.replaceAll("_", " ").toUpperCase()})
          </a>
          <p>{entry.Date}</p>
          {own ? (
            <>
              <h4 className={entryStyles.participantList}>Teilnehmer</h4>
              <p className={entryStyles.participantList}>
                {entry.Participants.map((p) => (
                  <a
                    className={entryStyles.participant}
                    key={p.windowsUsername}
                    href={config.TEAMS_CHAT_LINK.replace(
                      "$USERNAME",
                      p.windowsUsername
                    )}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {p.name}
                  </a>
                ))}
              </p>
            </>
          ) : (
            <button
              className={entryStyles.signBtn}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (isSignedIn) return handleParticipant(e, true, entry);
                setSignin(entry);
              }}
            >
              {isSignedIn ? "Austragen" : "Eintragen"}
            </button>
          )}
        </div>
      );
    });
  };

  const locationsHTML = (filter: boolean) => {
    return (
      <>
        {filter && (
          <>
            <option value="default" disabled>
              Auswählen
            </option>
            {signins.length && <option value="signins">Eingetragen</option>}
          </>
        )}
        {config.LOCATIONS.map((loc) => (
          <option
            key={loc.replaceAll(" ", "_").toLowerCase()}
            value={loc.replaceAll(" ", "_").toLowerCase()}
          >
            {loc}
          </option>
        ))}
      </>
    );
  };

  const handleParticipant = async (
    event: React.FormEvent<HTMLFormElement> | React.MouseEvent,
    remove: boolean,
    entry: Entry | null
  ) => {
    event.preventDefault();
    const action = remove ? "remove" : "add";

    let formData;
    let formValues;
    if (!remove) {
      formData = new FormData(event.target as HTMLFormElement);
      formValues = Object.fromEntries(formData);
    }

    const data = remove
      ? {
          entry,
          participant: signins.find(({ _id }) => _id === entry?._id)
            ?.SigninName,
        }
      : {
          entry: signin,
          participant: {
            name: formValues?.name,
            windowsUsername: formValues?.windowsUsername,
          },
        };

    const res = await fetch(`/api/participant/${action}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const json: ApiResponse = await res.json();
    if (json?.error) return console.log(json.error);

    const newSignins = remove
      ? signins.filter(({ _id }) => _id !== json.savedEntry._id)
      : signins;
    if (!remove && formValues)
      newSignins.push({
        _id: json.savedEntry._id,
        SigninName: formValues.name as string,
      });
    setSignins(newSignins);
    localStorage.setItem("signins", JSON.stringify(newSignins));

    setSignin(null);
    fetchData(null, false);
  };

  const handleEntry = async (
    event: React.FormEvent<HTMLFormElement> | React.MouseEvent,
    create: boolean,
    entry: Entry | null
  ) => {
    event.preventDefault();
    const action = create ? "create" : "delete";

    let formData;
    let formValues;
    if (create) {
      formData = new FormData(event.target as HTMLFormElement);
      formValues = Object.fromEntries(formData);
      if (!(formValues?.route as string).includes("//goo.gl/maps"))
        return setInvalidMessage("Kein gültiger Google Maps Routen Link");
    }

    const data = create
      ? {
          name: formValues?.name,
          windowsUsername: formValues?.windowsUsername,
          location: formValues?.location,
          route: formValues?.route,
          date: formValues?.date,
          maxParticipants: Math.abs(Number(formValues?.maxParticipants)),
        }
      : { entry };

    const res = await fetch(`/api/entries/${action}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const json: ApiResponse = await res.json();
    if (json?.error) return console.log(json.error);

    const newOwnEntries = entry
      ? ownEntries.filter((id) => id !== entry?._id)
      : ownEntries;
    if (create) newOwnEntries.push(json.savedEntry._id);
    setOwnEntries(newOwnEntries);
    localStorage.setItem("ownEntries", JSON.stringify(newOwnEntries));

    setInvalidMessage(null);
    setCreateEntry(false);
    fetchData(null, false);
  };

  return (
    <>
      <div className={pageStyles.page}>
        <header>
          <div className={pageStyles.flexbox}>
            <h1>Aktuelle Fahrten</h1>
            <Image
              src="/interhyp_logo.png"
              alt="interhyp logo"
              width={400}
              height={80}
            />
          </div>
          <button
            className={styles.createEntryBtn}
            onClick={() => setCreateEntry(true)}
          >
            +
          </button>
          <div className={pageStyles.column}>
            <label htmlFor="filter" className={styles.spaceTop}>
              Filter
            </label>
            <select
              defaultValue="default"
              className={styles.filterSelect}
              name="filter"
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                fetchData(e.target.value, false)
              }
            >
              {locationsHTML(true)}
            </select>
          </div>
        </header>
        <main className={pageStyles.column}>
          {ownEntries.length ? (
            <>
              <h2>Eigene Fahrten:</h2>
              <div className={pageStyles.grid}>
                {entriesHTML(
                  entries.filter((entry) =>
                    ownEntries.some((id) => id === entry._id)
                  ),
                  true
                )}
              </div>
              <h2>Andere Fahrten:</h2>
            </>
          ) : (
            <></>
          )}
          {entries.filter((entry) => {
            if (onlySignins) return !ownEntries.some((id) => id === entry._id);
            return (
              !ownEntries.some((id) => id === entry._id) &&
              (entry.Participants.length < entry.MaxParticipants ||
                signins.some(({ _id }) => _id === entry._id))
            );
          }).length ? (
            <div className={pageStyles.grid}>
              {entriesHTML(
                entries.filter((entry) => {
                  if (onlySignins)
                    return !ownEntries.some((id) => id === entry._id);
                  return (
                    !ownEntries.some((id) => id === entry._id) &&
                    (entry.Participants.length < entry.MaxParticipants ||
                      signins.some(({ _id }) => _id === entry._id))
                  );
                }),
                false
              )}
            </div>
          ) : (
            <div className={styles.searchIcon}>
              <Image
                src="/no-search-results-icon.png"
                alt="no search results icon"
                width={275}
                height={275}
              />
            </div>
          )}
        </main>
        {signin && (
          <form
            className={styles.popup}
            onSubmit={(e: React.FormEvent<HTMLFormElement>) =>
              handleParticipant(e, false, null)
            }
          >
            <button className={styles.closeBtn} onClick={() => setSignin(null)}>
              &#10006;
            </button>
            <div className={pageStyles.field}>
              <p>Name</p>
              <input
                required
                type="text"
                className={pageStyles.input}
                name="name"
                placeholder="Vorname Nachname"
              />
            </div>
            <div className={pageStyles.field}>
              <p>Windows Benutzername</p>
              <input
                required
                type="text"
                className={pageStyles.input}
                name="windowsUsername"
                placeholder="mmustermann (Max Mustermann)"
              />
            </div>
            <button className={pageStyles.primaryBtn}>Bestätigen</button>
          </form>
        )}
        {createEntry && (
          <form
            className={styles.popup}
            onSubmit={(e: React.FormEvent<HTMLFormElement>) =>
              handleEntry(e, true, null)
            }
          >
            <button
              className={styles.closeBtn}
              onClick={() => {
                setCreateEntry(false);
                setInvalidMessage(null);
              }}
            >
              &#10006;
            </button>
            <div className={pageStyles.field}>
              <p>Name</p>
              <input
                required
                type="text"
                className={pageStyles.input}
                name="name"
                placeholder="Vorname Nachname"
              />
            </div>
            <div className={pageStyles.field}>
              <p>Windows Benutzername</p>
              <input
                required
                type="text"
                className={pageStyles.input}
                name="windowsUsername"
                placeholder="mmustermann (Max Mustermann)"
              />
            </div>
            <div className={pageStyles.field}>
              <p>Niederlassung</p>
              <select
                defaultValue="münchen"
                name="location"
                required
                className={pageStyles.input}
              >
                {locationsHTML(false)}
              </select>
            </div>
            {invalidMessage ? (
              <div className={pageStyles.field}>
                <p>Route</p>
                <div className={pageStyles.invalidDiv}>
                  <label htmlFor="route" className={pageStyles.invalidMessage}>
                    {invalidMessage}
                  </label>
                  <input
                    required
                    type="text"
                    className={pageStyles.invalidInput}
                    name="route"
                    placeholder="Google Maps Link"
                  />
                </div>
              </div>
            ) : (
              <div className={pageStyles.field}>
                <p>Route</p>
                <input
                  required
                  type="text"
                  className={pageStyles.input}
                  name="route"
                  placeholder="Google Maps Link"
                />
              </div>
            )}
            <div className={pageStyles.field}>
              <p>Datum - Uhrzeit</p>
              <input
                required
                type="datetime-local"
                className={pageStyles.input}
                name="date"
                defaultValue={currentDateTime()}
              />
            </div>
            <div className={pageStyles.field}>
              <p>Max. Teilnehmer</p>
              <input
                required
                type="number"
                className={pageStyles.input}
                name="maxParticipants"
                placeholder="Zahl"
              />
            </div>
            <button className={pageStyles.primaryBtn}>Erstellen</button>
          </form>
        )}
      </div>
    </>
  );
};

export default Home;
