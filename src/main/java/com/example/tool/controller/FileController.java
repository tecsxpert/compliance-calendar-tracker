package com.example.tool.controller;

import com.example.tool.entity.FileMetadata;
import com.example.tool.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FileController {

    private final FileService fileService;

    // POST /api/files/upload  → 201 CREATED
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        FileMetadata metadata = fileService.upload(file);

        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/{id}")
                .buildAndExpand(metadata.getId())
                .toUri();

        return ResponseEntity.created(location).body(Map.of(
                "id",           metadata.getId(),
                "originalName", metadata.getOriginalName(),
                "fileType",     metadata.getFileType(),
                "size",         metadata.getSize(),
                "uploadedAt",   metadata.getUploadedAt().toString(),
                "downloadUrl",  location.toString()
        ));
    }

    // GET /api/files/{id}  → 200 OK | 404 NOT FOUND
    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws IOException {
        FileMetadata metadata = fileService.getMetadata(id);
        Resource resource    = fileService.download(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(metadata.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + metadata.getOriginalName() + "\"")
                .body(resource);
    }
}
