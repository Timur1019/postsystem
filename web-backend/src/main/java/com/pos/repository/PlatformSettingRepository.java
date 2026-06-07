package com.pos.repository;

import com.pos.entity.PlatformSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformSettingRepository extends JpaRepository<PlatformSetting, String> {
}
