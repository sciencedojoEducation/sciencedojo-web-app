import Foundation
import Vision
let root = URL(fileURLWithPath: CommandLine.arguments[1])
let regex = try NSRegularExpression(pattern: "\\S+")
let files = try FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil).filter { $0.lastPathComponent.hasPrefix("page-") && $0.pathExtension == "jpg" }.sorted { $0.lastPathComponent < $1.lastPathComponent }
for file in files {
 let target = file.deletingPathExtension().appendingPathExtension("words.json")
 if FileManager.default.fileExists(atPath: target.path) { continue }
 do {
  let request = VNRecognizeTextRequest(); request.recognitionLevel = .accurate
  request.recognitionLanguages = ["de-DE", "en-US"]; request.usesLanguageCorrection = true
  try VNImageRequestHandler(url: file, options: [:]).perform([request])
  let rows: [[String: Any]] = (request.results ?? []).compactMap { o in
   guard let c = o.topCandidates(1).first else { return nil }
   let words: [[String: Any]] = regex.matches(in:c.string,range:NSRange(c.string.startIndex...,in:c.string)).compactMap { m in
    guard let range = Range(m.range,in:c.string), let box = try? c.boundingBox(for:range)?.boundingBox else { return nil }
    return ["text":String(c.string[range]),"x":box.minX,"y":1-box.maxY,"w":box.width,"h":box.height]
   }
   return ["text":c.string,"confidence":c.confidence,"x":o.boundingBox.minX,"y":1-o.boundingBox.maxY,"w":o.boundingBox.width,"h":o.boundingBox.height,"words":words]
  }
  try JSONSerialization.data(withJSONObject:rows,options:[.sortedKeys]).write(to:target)
  print("OCR \(file.lastPathComponent): \(rows.count) rows")
 } catch { print("ERROR \(file.lastPathComponent): \(error)") }
}
