import Foundation
import Vision
import AppKit
let root = URL(fileURLWithPath: CommandLine.arguments[1])
let files = try FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil).filter { $0.lastPathComponent.hasPrefix("page-") && $0.pathExtension == "jpg" }.sorted { $0.lastPathComponent < $1.lastPathComponent }
for file in files {
    let target = file.deletingPathExtension().appendingPathExtension("json")
    if FileManager.default.fileExists(atPath:target.path) { continue }
    do {
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      request.recognitionLanguages = ["de-DE", "en-US"]
      request.usesLanguageCorrection = true
      try VNImageRequestHandler(url: file, options: [:]).perform([request])
      let rows: [[String: Any]] = (request.results ?? []).compactMap { o in
        guard let c = o.topCandidates(1).first else { return nil }
        return ["text":c.string,"confidence":c.confidence,"x":o.boundingBox.minX,"y":1-o.boundingBox.maxY,"w":o.boundingBox.width,"h":o.boundingBox.height]
      }
      try JSONSerialization.data(withJSONObject:rows,options:[.prettyPrinted,.sortedKeys]).write(to:target)
      print("OCR \(file.lastPathComponent): \(rows.count) lines")
    } catch { print("ERROR \(file.lastPathComponent): \(error)") }
}
