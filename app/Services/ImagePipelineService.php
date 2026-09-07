<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;

class ImagePipelineService
{
    /** @return array{path: string, path_webp: ?string} */
    public function storeProductImage(UploadedFile $file): array
    {
        $base = 'products/'.Str::uuid();
        $originalPath = $file->storeAs('products', basename($base).'.'.$file->guessExtension(), 'public');

        try {
            $manager = ImageManager::gd();
            $image = $manager->read($file->getRealPath())->scaleDown(1200, 1200);
            $webpRel = $base.'-1200.webp';
            $full = storage_path('app/public/'.$webpRel);
            @mkdir(dirname($full), 0755, true);
            $image->toWebp(82)->save($full);

            foreach ([300, 600] as $size) {
                $sized = $manager->read($file->getRealPath())->scaleDown($size, $size);
                $rel = $base."-{$size}.webp";
                $sized->toWebp(82)->save(storage_path('app/public/'.$rel));
            }

            return ['path' => $originalPath, 'path_webp' => $webpRel];
        } catch (\Throwable) {
            return ['path' => $originalPath, 'path_webp' => null];
        }
    }
}
