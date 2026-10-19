import s from "./business.module.css";

export type BusinessArm = "engineering" | "instructional-design";

export default function BusinessBrand({ arm }: { arm?: BusinessArm }) {
  return <><span className={s.wordmark}>science<span className={s.dojo}>dojo</span><span className={s.dot}>.</span></span>{arm && <small className={s.descriptor}>{arm === "engineering" ? "Engineering" : "Instructional design"}</small>}</>;
}
