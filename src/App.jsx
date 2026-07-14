import React, { useState, useEffect } from "react";
import { Droplet, MapPin, Phone, Plus, AlertCircle, Users, Clock, X, HeartPulse } from "lucide-react";
import { supabase } from "./supabaseClient";

const VILLES = ["Yaoundé", "Douala", "Bafoussam", "Garoua", "Maroua", "Bamenda", "Buea", "Ngaoundéré", "Bertoua", "Ebolowa"];
const GROUPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

const COMPATIBILITE = {
  "O-": ["O-"],
  "O+": ["O+", "O-"],
  "A-": ["A-", "O-"],
  "A+": ["A+", "A-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "AB+": GROUPES,
};

const URGENCE_LABEL = { immediate: "Immédiate", "24h": "Sous 24h" };

function TypeBadge({ groupe, size = "md" }) {
  const s = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return (
    <span className={`font-mono font-bold rounded-md bg-[#E63946]/15 text-[#E63946] border border-[#E63946]/30 ${s}`}>
      {groupe}
    </span>
  );
}

function Pulse({ active }) {
  return (
    <svg viewBox="0 0 400 40" className="w-full h-8 md:h-10" preserveAspectRatio="none">
      <polyline
        points="0,20 60,20 80,4 100,36 120,20 180,20 200,8 215,32 230,20 400,20"
        fill="none"
        stroke={active ? "#E63946" : "#3F5647"}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        className={active ? "animate-pulse" : ""}
      />
    </svg>
  );
}

export default function App() {
  const [donneurs, setDonneurs] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [onglet, setOnglet] = useState("demandes");
  const [modal, setModal] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [pret, setPret] = useState(false);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: d, error: eD }, { data: r, error: eR }] = await Promise.all([
          supabase.from("donneurs").select("*").order("id"),
          supabase.from("demandes").select("*").order("created_at", { ascending: false }),
        ]);
        if (eD || eR) throw eD || eR;
        setDonneurs(d || []);
        setDemandes(r || []);
      } catch (e) {
        console.error(e);
        setErreur(true);
      } finally {
        setPret(true);
      }
    })();
  }, []);

  const ajouterDonneur = async (nv) => {
    const { data, error } = await supabase.from("donneurs").insert([nv]).select();
    if (error) {
      setErreur(true);
      return;
    }
    setDonneurs((prev) => [...prev, ...data]);
  };

  const ajouterDemande = async (nv) => {
    const { data, error } = await supabase
      .from("demandes")
      .insert([{ ...nv, created_at: new Date().toISOString() }])
      .select();
    if (error) {
      setErreur(true);
      return;
    }
    setDemandes((prev) => [...data, ...prev]);
  };

  const urgenceActive = demandes.some((d) => d.urgence === "immediate");

  const donneursCompatibles = (demande) => {
    const groupesOk = COMPATIBILITE[demande.groupe] || [];
    return donneurs.filter((d) => groupesOk.includes(d.groupe) && d.ville === demande.ville);
  };

  if (!pret) {
    return (
      <div className="min-h-screen bg-[#12201A] text-[#9FB3A6] flex items-center justify-center font-body">
        <p className="text-sm">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#12201A] text-[#F5F1E8]">
      <header className="font-body px-5 pt-8 pb-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2 text-[#F2C14E] mb-3">
          <HeartPulse size={18} />
          <span className="text-xs tracking-widest uppercase font-semibold">SOS Sang Cameroun</span>
        </div>
        <h1 className="font-display text-3xl leading-tight font-semibold mb-2">
          Un appel,<br /><span className="text-[#E63946]">une vie sauvée.</span>
        </h1>
        <p className="text-[#9FB3A6] text-sm leading-relaxed mb-4">
          Le Cameroun ne couvre que 47% de ses besoins annuels en sang. Ici, un donneur
          compatible dans votre ville est à un appel de distance.
        </p>
        <Pulse active={urgenceActive} />
        {erreur && (
          <p className="text-[10px] text-[#E63946] mt-2">
            Connexion à la base de données impossible — vérifiez la configuration Supabase (.env).
          </p>
        )}
      </header>

      <nav className="max-w-lg mx-auto px-5 flex gap-2 mb-4 font-body">
        {[
          { key: "demandes", label: "Demandes actives", icon: AlertCircle },
          { key: "donneurs", label: "Donneurs inscrits", icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setOnglet(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2.5 rounded-lg border transition-colors ${
              onglet === key ? "bg-[#E63946] border-[#E63946] text-white" : "border-[#3F5647] text-[#9FB3A6]"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </nav>

      <div className="max-w-lg mx-auto px-5 flex gap-2 mb-6 font-body">
        <button
          onClick={() => setModal("demande")}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-3 rounded-lg bg-[#E63946] text-white"
        >
          <Plus size={16} /> Demande urgente
        </button>
        <button
          onClick={() => setModal("donneur")}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-3 rounded-lg bg-[#1B2B22] border border-[#3F5647] text-[#F5F1E8]"
        >
          <Droplet size={16} /> Devenir donneur
        </button>
      </div>

      <main className="max-w-lg mx-auto px-5 pb-16 font-body">
        {onglet === "demandes" && (
          <div className="space-y-3">
            {demandes.length === 0 && (
              <p className="text-[#9FB3A6] text-sm text-center py-10">Aucune demande active pour le moment.</p>
            )}
            {demandes.map((d) => {
              const compat = donneursCompatibles(d);
              const isOpen = expanded === d.id;
              return (
                <div key={d.id} className="bg-[#1B2B22] border border-[#3F5647] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TypeBadge groupe={d.groupe} />
                      {d.urgence === "immediate" && (
                        <span className="text-[10px] uppercase tracking-wide font-semibold text-[#E63946] flex items-center gap-1">
                          <AlertCircle size={12} /> Immédiate
                        </span>
                      )}
                    </div>
                    <span className="text-[#9FB3A6] text-xs flex items-center gap-1">
                      <Clock size={11} /> {URGENCE_LABEL[d.urgence]}
                    </span>
                  </div>
                  <p className="font-medium text-sm mb-0.5">{d.hopital}</p>
                  <p className="text-[#9FB3A6] text-xs flex items-center gap-1 mb-3">
                    <MapPin size={11} /> {d.ville}
                  </p>
                  <button
                    onClick={() => setExpanded(isOpen ? null : d.id)}
                    className="w-full text-xs font-semibold py-2 rounded-lg bg-[#12201A] border border-[#3F5647] text-[#F2C14E]"
                  >
                    {compat.length} donneur{compat.length !== 1 ? "s" : ""} compatible{compat.length !== 1 ? "s" : ""} · {isOpen ? "masquer" : "afficher"}
                  </button>
                  {isOpen && (
                    <div className="mt-2 space-y-2">
                      {compat.length === 0 && (
                        <p className="text-[#9FB3A6] text-xs py-2">Aucun donneur compatible enregistré dans cette ville pour l'instant.</p>
                      )}
                      {compat.map((don) => (
                        <div key={don.id} className="flex items-center justify-between bg-[#12201A] rounded-lg px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">{don.nom}</p>
                            <p className="text-[10px] text-[#9FB3A6]">{don.groupe} · {don.ville}</p>
                          </div>
                          <a href={`tel:${don.tel.replace(/\s/g, "")}`} className="flex items-center gap-1 text-xs font-semibold text-[#F2C14E]">
                            <Phone size={13} /> Appeler
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {onglet === "donneurs" && (
          <div className="space-y-2">
            {donneurs.map((d) => (
              <div key={d.id} className="flex items-center justify-between bg-[#1B2B22] border border-[#3F5647] rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <TypeBadge groupe={d.groupe} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{d.nom}</p>
                    <p className="text-[10px] text-[#9FB3A6] flex items-center gap-1"><MapPin size={10} /> {d.ville}</p>
                  </div>
                </div>
                <a href={`tel:${d.tel.replace(/\s/g, "")}`} className="text-[#F2C14E]">
                  <Phone size={15} />
                </a>
              </div>
            ))}
          </div>
        )}
      </main>

      {modal && (
        <Modal
          type={modal}
          onClose={() => setModal(null)}
          onSubmitDonneur={async (nv) => {
            await ajouterDonneur(nv);
            setModal(null);
          }}
          onSubmitDemande={async (nv) => {
            await ajouterDemande(nv);
            setModal(null);
            setOnglet("demandes");
          }}
        />
      )}
    </div>
  );
}

function Modal({ type, onClose, onSubmitDonneur, onSubmitDemande }) {
  const isDemande = type === "demande";
  const [form, setForm] = useState(
    isDemande
      ? { groupe: "O-", hopital: "", ville: VILLES[0], urgence: "immediate", tel: "" }
      : { nom: "", groupe: "O-", ville: VILLES[0], tel: "" }
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const valid = isDemande ? form.hopital.trim() && form.tel.trim() : form.nom.trim() && form.tel.trim();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 font-body">
      <div className="bg-[#1B2B22] border border-[#3F5647] rounded-t-2xl md:rounded-2xl w-full max-w-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">
            {isDemande ? "Demande urgente de sang" : "Devenir donneur"}
          </h2>
          <button onClick={onClose} className="text-[#9FB3A6]"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          {!isDemande && (
            <Field label="Nom">
              <input value={form.nom} onChange={(e) => set("nom", e.target.value)} placeholder="Votre nom" className="input" />
            </Field>
          )}

          {isDemande && (
            <Field label="Hôpital / structure de santé">
              <input
                value={form.hopital}
                onChange={(e) => set("hopital", e.target.value)}
                placeholder="Ex : Hôpital Général de Douala"
                className="input"
              />
            </Field>
          )}

          <Field label="Groupe sanguin">
            <div className="grid grid-cols-4 gap-2">
              {GROUPES.map((g) => (
                <button
                  key={g}
                  onClick={() => set("groupe", g)}
                  className={`font-mono text-sm font-bold py-2 rounded-lg border ${
                    form.groupe === g ? "bg-[#E63946] border-[#E63946] text-white" : "border-[#3F5647] text-[#F5F1E8]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Ville">
            <select value={form.ville} onChange={(e) => set("ville", e.target.value)} className="input">
              {VILLES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>

          {isDemande && (
            <Field label="Degré d'urgence">
              <div className="grid grid-cols-2 gap-2">
                {["immediate", "24h"].map((u) => (
                  <button
                    key={u}
                    onClick={() => set("urgence", u)}
                    className={`text-sm font-medium py-2 rounded-lg border ${
                      form.urgence === u ? "bg-[#F2C14E] border-[#F2C14E] text-[#12201A]" : "border-[#3F5647] text-[#F5F1E8]"
                    }`}
                  >
                    {URGENCE_LABEL[u]}
                  </button>
                ))}
              </div>
            </Field>
          )}

          <Field label="Téléphone de contact">
            <input value={form.tel} onChange={(e) => set("tel", e.target.value)} placeholder="6XX XX XX XX" className="input" />
          </Field>
        </div>

        <button
          disabled={!valid}
          onClick={() => (isDemande ? onSubmitDemande(form) : onSubmitDonneur(form))}
          className="w-full mt-5 py-3 rounded-lg font-semibold text-sm bg-[#E63946] text-white disabled:opacity-40"
        >
          {isDemande ? "Publier la demande" : "M'inscrire comme donneur"}
        </button>

        <style>{`
          .input {
            width: 100%;
            background: #12201A;
            border: 1px solid #3F5647;
            border-radius: 0.5rem;
            padding: 0.6rem 0.75rem;
            color: #F5F1E8;
            font-size: 0.875rem;
          }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs text-[#9FB3A6] mb-1 block">{label}</span>
      {children}
    </label>
  );
}
